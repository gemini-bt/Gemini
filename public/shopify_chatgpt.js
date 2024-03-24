// JavaScript for adding products to the cart
document.addEventListener("DOMContentLoaded", function() {
    // Select all "Add to Cart" buttons
    var addToCartButtons = document.querySelectorAll(".product button");

    // Loop through each button and add click event listener
    addToCartButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            // Get product information
            var product = this.parentNode;
            var productName = product.querySelector("h2").textContent;
            var productPrice = product.querySelector("p:nth-child(3)").textContent;

            // Format product information
            var cartItem = productName + " - " + productPrice;

            // Add product to cart (for demonstration, just log it)
            console.log("Product added to cart: " + cartItem);
        });
    });
});
