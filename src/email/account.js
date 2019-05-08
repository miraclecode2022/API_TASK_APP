const sgMail = require('@sendgrid/mail')
require('dotenv').config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email,name) => {
    sgMail.send({
        to : email,
        from : 'gialonghypercode@gmail.com',
        subject : 'Thank for joining with us',
        html : `<h1>Welcome To Join With Us </h1> <span>Dir ${name} </span> <p>Thank for joining. We hope you will have fun time with app</p>`
    })
}

const sendRemoveEmail = (email, name) => {
    sgMail.send({
        to : email,
        from : 'gialonghypercode@gmail.com',
        subject : 'Sorry to see you go!',
        html : `<h1> Hope See You Again </h1> <span>Dir ${name} </span> <p> We hope will see you again in the next time </p>`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendRemoveEmail
}