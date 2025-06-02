<?php
require_once 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

$email_config = require 'config/email.php';

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = $email_config['smtp_host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $email_config['smtp_username'];
    $mail->Password   = $email_config['smtp_password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $email_config['smtp_port'];

    // Recipients
    $mail->setFrom($email_config['smtp_from_email'], $email_config['smtp_from_name']);
    $mail->addAddress('test@example.com'); // Test recipient

    // Content
    $mail->isHTML(true);
    $mail->Subject = 'Test Email from BorrowBee';
    $mail->Body    = '<h1>Test Email</h1><p>This is a test email to verify SMTP configuration.</p>';

    $mail->send();
    echo 'Test email sent successfully!';
} catch (Exception $e) {
    echo "Email could not be sent. Error: {$mail->ErrorInfo}";
}
?>