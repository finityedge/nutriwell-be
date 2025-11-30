const nodemailer = require('nodemailer');
console.log('Type of nodemailer:', typeof nodemailer);
console.log('Keys:', Object.keys(nodemailer));
console.log('Nodemailer object:', nodemailer);

try {
    if (typeof nodemailer.createTransporter === 'function') {
        const transporter = nodemailer.createTransporter({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'test',
                pass: 'test'
            }
        });
        console.log('Nodemailer initialized successfully');
    } else {
        console.log('createTransporter is missing!');
    }
} catch (error) {
    console.error('Error:', error);
}
