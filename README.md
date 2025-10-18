from flask import Flask, send_file, render_template_string
import os
import mimetypes
import requests
from dotenv import load_dotenv
import atexit

# Import the scheduler
from apscheduler.schedulers.background import BackgroundScheduler

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# --- CONFIGURATION ---
WEBHOOK_URL = "http://localhost:5678/webhook-test/video-test"
VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv']
VIDEO_FOLDER_PATH = os.getenv("VIDEO_FOLDER_PATH")
SENT_LOG_FILE = "sent_videos.log"

# Your language priority order
LANGUAGE_PRIORITY_ORDER = ["KR", "FR", "EN"]


def get_video_files():
    """
    Get all video files from the VIDEO_FOLDER_PATH.
    """
    if not VIDEO_FOLDER_PATH or not os.path.isdir(VIDEO_FOLDER_PATH):
        print(f"ERROR: Invalid or missing VIDEO_FOLDER_PATH: {VIDEO_FOLDER_PATH}")
        return []

    files = [
        os.path.join(VIDEO_FOLDER_PATH, f)
        for f in os.listdir(VIDEO_FOLDER_PATH)
        if os.path.isfile(os.path.join(VIDEO_FOLDER_PATH, f)) and os.path.splitext(f)[1].lower() in VIDEO_EXTENSIONS
    ]
    
    print(f"DEBUG: Found {len(files)} video files.")
    return files

def send_videos_job():
    """
    This job finds the next unsent video based on the LANGUAGE_PRIORITY_ORDER.
    """
    print("SCHEDULER: Checking for a video to send based on priority...")

    # 1. Read the log of already sent videos
    sent_videos = set()
    try:
        with open(SENT_LOG_FILE, "r") as f:
            sent_videos = set(line.strip() for line in f)
    except FileNotFoundError:
        print("SCHEDULER: Log file not found. Will create a new one.")
        
    # 2. Find the next video to send based on the priority list
    all_videos = get_video_files()
    video_to_send = None
    
    for lang_prefix in LANGUAGE_PRIORITY_ORDER:
        for video_path in all_videos:
            video_filename = os.path.basename(video_path)
            
            # CRITICAL CHANGE: Updated to look for an underscore "_".
            if video_filename.startswith(lang_prefix + "_") and video_filename not in sent_videos:
                video_to_send = video_path
                break 
        if video_to_send:
            break 

    if not video_to_send:
        print("SCHEDULER: No new priority videos to send at this time.")
        return

    print(f"SCHEDULER: Attempting to send '{os.path.basename(video_to_send)}'...")
    try:
        mime_type, _ = mimetypes.guess_type(video_to_send)
        with open(video_to_send, "rb") as f:
            files_payload = [
                ("file", (os.path.basename(video_to_send), f, mime_type or "application/octet-stream"))
            ]
            response = requests.post(WEBHOOK_URL, files=files_payload, timeout=300)

        if response.ok:
            print(f"SCHEDULER SUCCESS: Sent {os.path.basename(video_to_send)}. Status: {response.status_code}")
            with open(SENT_LOG_FILE, "a") as f:
                f.write(os.path.basename(video_to_send) + "\n")
        else:
            print(f"SCHEDULER FAILED: Could not send {os.path.basename(video_to_send)}. Status: {response.status_code}")

    except Exception as e:
        print(f"SCHEDULER ERROR: An exception occurred -> {str(e)}")


@app.route("/")
def index(): return "<p>Hello world</p>"

# --- SCHEDULER SETUP ---
scheduler = BackgroundScheduler()
# The time interval is set to 1 minute as requested.
scheduler.add_job(func=send_videos_job, trigger="interval", minutes=1)
scheduler.start()

# Shut down the scheduler when the app exits
atexit.register(lambda: scheduler.shutdown())


if __name__ == "__main__":
    send_videos_job() # Run once on startup to send the first video immediately
    app.run(host="0.0.0.0", port=5000, debug=True)




env file
VIDEO_FOLDER_PATH="C:/Users/Administrator/Desktop/videos"

Client id
gg494696160659-ld9i14plpdk51ppmljp7k9rq6098n295.apps.googleusercontent.comgg
ggGOCSPX-LrXLSVJSUUaiKzA21Ooi5VF0EPVFgg
