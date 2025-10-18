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



Json for workflow
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "video-test",
        "responseMode": "responseNode",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [
        640,
        -528
      ],
      "id": "9ee7c229-fe5d-48da-b1a3-478f43808ad8",
      "name": "Webhook",
      "webhookId": "0e6dafe1-9927-4286-80fc-db39aaa1a1d6",
      "alwaysOutputData": false
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": \"true\"\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.4,
      "position": [
        2016,
        -688
      ],
      "id": "61515b1d-3fca-474a-90cc-e50a41d70835",
      "name": "Respond to Webhook"
    },
    {
      "parameters": {
        "resource": "video",
        "operation": "upload",
        "title": "={{ $json.title }}",
        "regionCode": "PK",
        "categoryId": "=22",
        "binaryProperty": "file",
        "options": {
          "description": "={{ $json.description }}",
          "privacyStatus": "private",
          "tags": "={{ $json.tags }}"
        }
      },
      "type": "n8n-nodes-base.youTube",
      "typeVersion": 1,
      "position": [
        1328,
        -672
      ],
      "id": "5c416958-f5f6-4980-ae06-98a97f7577a5",
      "name": "Upload a video",
      "credentials": {
        "youTubeOAuth2Api": {
          "id": "p9iY33rX5YctcMRm",
          "name": "YouTube account"
        }
      }
    },
    {
      "parameters": {
        "authentication": "serviceAccount",
        "documentId": {
          "__rl": true,
          "value": "1dZP6BTEgoHAfsCV5pUZsqRGZzHg_YN_piAf00-opCR4",
          "mode": "list",
          "cachedResultName": "video data",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1dZP6BTEgoHAfsCV5pUZsqRGZzHg_YN_piAf00-opCR4/edit?usp=drivesdk"
        },
        "sheetName": {
          "__rl": true,
          "value": "gid=0",
          "mode": "list",
          "cachedResultName": "Sheet1",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1dZP6BTEgoHAfsCV5pUZsqRGZzHg_YN_piAf00-opCR4/edit#gid=0"
        },
        "filtersUI": {
          "values": [
            {
              "lookupColumn": "video code",
              "lookupValue": "={{ $json.fileName }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        928,
        -240
      ],
      "id": "81a34fb6-2dd5-4829-a42e-8a99a25f4455",
      "name": "Get row(s) in sheet",
      "credentials": {
        "googleApi": {
          "id": "nWzte2EdFvd0MDs3",
          "name": "Google Service Account account"
        }
      }
    },
    {
      "parameters": {
        "mode": "combine",
        "combineBy": "combineByPosition",
        "options": {}
      },
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        1040,
        -512
      ],
      "id": "7d25f8e4-f358-43b1-a465-c82e228b8466",
      "name": "Merge"
    },
    {
      "parameters": {
        "jsCode": "// Get binary data from the first item\nconst binaryData = items[0].binary;\n\n// Prepare result array\nconst results = [];\n\n// Loop through all binary keys (file0, file1, file2, etc.)\nfor (const key of Object.keys(binaryData)) {\n  const fileInfo = binaryData[key];\n  \n  // Extract filename without extension\n  const fullFileName = fileInfo.fileName;\n  const fileNameWithoutExtension =\n    fullFileName.substring(0, fullFileName.lastIndexOf('.')) || fullFileName;\n\n  // Push result\n  results.push({\n    json: {\n      fileName: fileNameWithoutExtension,\n    },\n  });\n}\n\nreturn results;\n"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        768,
        -240
      ],
      "id": "b1e7028c-dffc-4e69-a1f0-cf291386e213",
      "name": "Code"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json[\"video code\"] }}",
                    "rightValue": "KR_india",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "383d545b-3383-4255-a337-724277eb6d81"
                  }
                ],
                "combinator": "and"
              }
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "ce6d54fa-2f05-47d9-957f-ccfb7b58eff5",
                    "leftValue": "={{ $json[\"video code\"] }}",
                    "rightValue": "FR_pakistan",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "2c637107-16d9-4679-9bb0-69bccb41f008",
                    "leftValue": "={{ $json[\"video code\"] }}",
                    "rightValue": "EN_bangladesh",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        1168,
        -528
      ],
      "id": "fe2f7703-c3d0-4e6d-995d-50e2d32661e7",
      "name": "Switch"
    },
    {
      "parameters": {
        "resource": "video",
        "operation": "upload",
        "title": "={{ $json.title }}",
        "regionCode": "PK",
        "categoryId": "=22",
        "binaryProperty": "file",
        "options": {
          "description": "={{ $json.description }}",
          "privacyStatus": "private",
          "tags": "={{ $json.tags }}"
        }
      },
      "type": "n8n-nodes-base.youTube",
      "typeVersion": 1,
      "position": [
        1328,
        -512
      ],
      "id": "28125164-0721-484e-bd52-abbc1c4b1579",
      "name": "Upload a video1",
      "credentials": {
        "youTubeOAuth2Api": {
          "id": "p9iY33rX5YctcMRm",
          "name": "YouTube account"
        }
      }
    },
    {
      "parameters": {
        "resource": "video",
        "operation": "upload",
        "title": "={{ $json.title }}",
        "regionCode": "PK",
        "categoryId": "=22",
        "binaryProperty": "file",
        "options": {
          "description": "={{ $json.description }}",
          "privacyStatus": "private",
          "tags": "={{ $json.tags }}"
        }
      },
      "type": "n8n-nodes-base.youTube",
      "typeVersion": 1,
      "position": [
        1328,
        -352
      ],
      "id": "a60e6c53-d289-491e-a841-c4cbee0280c3",
      "name": "Upload a video2",
      "credentials": {
        "youTubeOAuth2Api": {
          "id": "p9iY33rX5YctcMRm",
          "name": "YouTube account"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": \"true\"\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.4,
      "position": [
        2032,
        -528
      ],
      "id": "bd64a007-a0af-49a9-ba62-ccc95599422a",
      "name": "Respond to Webhook1"
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": \"true\"\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.4,
      "position": [
        2032,
        -368
      ],
      "id": "967138b6-2b27-4487-b832-f0fe9c5b786d",
      "name": "Respond to Webhook2"
    },
    {
      "parameters": {
        "authentication": "serviceAccount",
        "operation": "download",
        "fileId": {
          "__rl": true,
          "value": "={{ $json.id }}",
          "mode": "id"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.googleDrive",
      "typeVersion": 3,
      "position": [
        1040,
        -784
      ],
      "id": "46e1c6a0-ba9d-4b45-a180-39857cdda97d",
      "name": "Download file2",
      "credentials": {
        "googleApi": {
          "id": "nWzte2EdFvd0MDs3",
          "name": "Google Service Account account"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Get binary data from the first item\nconst binaryData = items[0].binary;\n\n// Prepare result array\nconst results = [];\n\n// Loop through all binary keys (file0, file1, file2, etc.)\nfor (const key of Object.keys(binaryData)) {\n  const fileInfo = binaryData[key];\n  \n  // Extract filename without extension\n  const fullFileName = fileInfo.fileName;\n  const fileNameWithoutExtension =\n    fullFileName.substring(0, fullFileName.lastIndexOf('.')) || fullFileName;\n\n  // Push result\n  results.push({\n    json: {\n      fileName: fileNameWithoutExtension,\n    },\n  });\n}\n\nreturn results;\n"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        784,
        -784
      ],
      "id": "56b7f5d6-0ed5-43cd-9204-07b5528e1bbb",
      "name": "Code1"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={{ $json.uploadId }}",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "youTubeOAuth2Api",
        "sendBody": true,
        "contentType": "binaryData",
        "inputDataFieldName": "data",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1872,
        -688
      ],
      "id": "8e8a9adf-890b-48aa-9eda-9a123fabcbca",
      "name": "HTTP Request",
      "credentials": {
        "youTubeOAuth2Api": {
          "id": "p9iY33rX5YctcMRm",
          "name": "YouTube account"
        }
      }
    },
    {
      "parameters": {
        "mode": "combine",
        "combineBy": "combineByPosition",
        "options": {}
      },
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        1712,
        -688
      ],
      "id": "12aaf95b-2788-4592-b835-13104ef77be5",
      "name": "Merge1"
    },
    {
      "parameters": {
        "authentication": "serviceAccount",
        "resource": "fileFolder",
        "queryString": "={{ $json.fileName }}",
        "returnAll": true,
        "filter": {},
        "options": {}
      },
      "type": "n8n-nodes-base.googleDrive",
      "typeVersion": 3,
      "position": [
        912,
        -784
      ],
      "id": "deed3194-52a1-4505-9395-6ea0b3852685",
      "name": "Search files and folders",
      "credentials": {
        "googleApi": {
          "id": "nWzte2EdFvd0MDs3",
          "name": "Google Service Account account"
        }
      }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={{ $json.uploadId }}",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "youTubeOAuth2Api",
        "sendBody": true,
        "contentType": "binaryData",
        "inputDataFieldName": "data",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1872,
        -528
      ],
      "id": "03f83aba-27a4-49fe-8def-a5e9a5d8071d",
      "name": "HTTP Request1",
      "credentials": {
        "youTubeOAuth2Api": {
          "id": "p9iY33rX5YctcMRm",
          "name": "YouTube account"
        }
      }
    },
    {
      "parameters": {
        "mode": "combine",
        "combineBy": "combineByPosition",
        "options": {}
      },
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        1696,
        -528
      ],
      "id": "2c22cf18-d371-4774-81b8-51e40ff66de2",
      "name": "Merge2"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={{ $json.uploadId }}",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "youTubeOAuth2Api",
        "sendBody": true,
        "contentType": "binaryData",
        "inputDataFieldName": "data",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1872,
        -368
      ],
      "id": "3abd160e-d88e-49f8-809b-52beb6114836",
      "name": "HTTP Request2",
      "credentials": {
        "youTubeOAuth2Api": {
          "id": "p9iY33rX5YctcMRm",
          "name": "YouTube account"
        }
      }
    },
    {
      "parameters": {
        "mode": "combine",
        "combineBy": "combineByPosition",
        "options": {}
      },
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        1712,
        -368
      ],
      "id": "07e47fa7-e575-493c-91f8-8f1dfaa61bb6",
      "name": "Merge3"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.name }}",
                    "rightValue": "KR",
                    "operator": {
                      "type": "string",
                      "operation": "contains"
                    },
                    "id": "d3beaa83-cbf5-4c34-9713-56af116de4e8"
                  }
                ],
                "combinator": "and"
              }
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "a9c83c0e-59b8-46f1-bd24-1ed014984af9",
                    "leftValue": "={{ $json.name }}",
                    "rightValue": "FR",
                    "operator": {
                      "type": "string",
                      "operation": "contains"
                    }
                  }
                ],
                "combinator": "and"
              }
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "a2e3b651-9c65-40eb-9995-7b546cadb271",
                    "leftValue": "={{ $json.name }}",
                    "rightValue": "EN",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              }
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        1168,
        -800
      ],
      "id": "8049c375-ad56-41d5-b2c5-6fe0080646d1",
      "name": "Switch1"
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Code",
            "type": "main",
            "index": 0
          },
          {
            "node": "Code1",
            "type": "main",
            "index": 0
          },
          {
            "node": "Merge",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Upload a video": {
      "main": [
        [
          {
            "node": "Merge1",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Get row(s) in sheet": {
      "main": [
        [
          {
            "node": "Merge",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Merge": {
      "main": [
        [
          {
            "node": "Switch",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code": {
      "main": [
        [
          {
            "node": "Get row(s) in sheet",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch": {
      "main": [
        [
          {
            "node": "Upload a video",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Upload a video1",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Upload a video2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Upload a video1": {
      "main": [
        [
          {
            "node": "Merge2",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Upload a video2": {
      "main": [
        [
          {
            "node": "Merge3",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Download file2": {
      "main": [
        [
          {
            "node": "Switch1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code1": {
      "main": [
        [
          {
            "node": "Search files and folders",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge1": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Search files and folders": {
      "main": [
        [
          {
            "node": "Download file2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request1": {
      "main": [
        [
          {
            "node": "Respond to Webhook1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge2": {
      "main": [
        [
          {
            "node": "HTTP Request1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request2": {
      "main": [
        [
          {
            "node": "Respond to Webhook2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge3": {
      "main": [
        [
          {
            "node": "HTTP Request2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch1": {
      "main": [
        [
          {
            "node": "Merge1",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Merge2",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Merge3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "5cf1b65bc6ea2cfffeea0df8a80c04fa111f447a6734f7a9cda6ea7be14a9daa"
  }
}
