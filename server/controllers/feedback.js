var _ = require('underscore')
	, nodemailer = require('nodemailer')
	, secrets = require('../config/secrets');


var smtpTransport = nodemailer.createTransport('SMTP', {
 service: 'Mailgun',
 auth: {
   user: secrets.mailgun.login,
   pass: secrets.mailgun.password
 }
});

exports.postFeedback = function(req, res) {

	if (!req.user) {
		return res.status(401).send("You are not logged in");
	}

	if (!req.body) return res.status(500).send('Malformed body');

	var ns = req.body;

	smtpTransport.sendMail({
    from: 'feedback@floodmodeler.com',
    to: 'peter.b.boyer@gmail.com',
    subject: "\"" + ns.subject + "\" says " + req.user.email,
    text: ns.message
	});

};