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

var emailTarget = process.env.FEEDBACK_EMAIL;

exports.postFeedback = function(req, res) {

	if (!req.user) {
		return res.status(401).send("You are not logged in");
	}

	if (!req.body) return res.status(500).send('Malformed body');

	var ns = req.body;

	if (!emailTarget) return req.status(500).send({ msg: "Feedback temporarily unsupported" });

	smtpTransport.sendMail({
    from: 'feedback@floodmodeler.com',
    to: emailTarget,
    subject: "\"" + ns.subject + "\" says " + req.user.email,
    text: ns.message
		}, function(err) {
	    if (err) {
	      return req.status(500).send({ msg: "Could not send feedback!  Try again later!" });
	    }
	    return req.send('success', { msg: 'Feedback has been sent successfully!' });
	  });

};