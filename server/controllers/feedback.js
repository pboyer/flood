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

var emailTarget = secrets.feedback.email;

exports.postFeedback = function(req, res) {

	if (!req.user) return res.status(401).send("You are not logged in");

	if (!req.body) return res.status(500).send('Malformed body');

	var ns = req.body;

	if (!emailTarget) return res.status(500).send({ msg: "Feedback temporarily unsupported" });

	smtpTransport.sendMail({
	    from: req.user.email,
	    to: emailTarget,
	    subject: "[FLOOD FEEDBACK] : \"" + ns.subject ? ns.subject : "Empty subject" + "\"",
	    text: ns.message ? ns.message : "Empty body",
		}, function(err) {
	    if (err) {
	      return res.status(500).send({ msg: "Could not send feedback!  Try again later!" });
	    }
	    return res.send({ msg: 'Feedback has been sent successfully!' });
	  });

};