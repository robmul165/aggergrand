document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevents the form from submitting
    
    let name = document.getElementById('name').value;
    let email = document.getElementById('email').value;
    let message = document.getElementById('message').value;
    let formMessage = '';

    if (name === '' || email === '' || message === '') {
        formMessage = 'Please fill out all fields.';
    } else if (!email.includes('@')) {
        formMessage = 'Please enter a valid email address.';
    } else {
        formMessage = 'Thank you for reaching out! We will get back to you soon.';
    }

    document.getElementById('formMessage').textContent = formMessage;
});