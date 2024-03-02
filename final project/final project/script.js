
 let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

 
 displayCartItems();


 function saveCartToLocalStorage() {
   localStorage.setItem('cartItems', JSON.stringify(cartItems));
 }


 function addToCart(productName, price) {
   
   cartItems.push({ name: productName, price: price });

   
   saveCartToLocalStorage();

 
   displayCartItems();
 }


 function removeFromCart(index) {
   cartItems.splice(index, 1);


   saveCartToLocalStorage();

   
   displayCartItems();
 }


 function displayCartItems() {
   const cartList = document.getElementById('cart-items');
   cartList.innerHTML = ''; 

   cartItems.forEach((item, index) => {
     const li = document.createElement('li');
     li.textContent = `${item.name} - $${item.price}`;
     
     
     const removeButton = document.createElement('button');
     removeButton.textContent = 'Remove';
     removeButton.onclick = () => removeFromCart(index); 
     li.appendChild(removeButton);

     cartList.appendChild(li);
   });
 }


 window.onload = function() {
   const storedCartItems = localStorage.getItem('cartItems');
   if (storedCartItems) {
     cartItems = JSON.parse(storedCartItems);
     displayCartItems();
   }
 }


 window.onbeforeunload = function() {
   saveCartToLocalStorage();
 };