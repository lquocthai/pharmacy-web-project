package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.exeption.AppException;
import com.quocthai.pharmacy_service.exeption.ErrorCode;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailService {

    JavaMailSender mailSender;

    public void sendOtpEmail(String to, String otp) {
        log.info("Service: Registering user with email: {}", to);
        try {
            log.info("Service: Registering : {}", to);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("lethai035600@gmail.com");
            helper.setTo(to);
            helper.setSubject("MÃ XÁC THỰC ĐĂNG KÝ - PHARMACY WEB");

            // gửi dạng html
            String htmlContent = "<h3>Chào mừng bạn đến với Pharmacy Service!</h3>"
                    + "<p>Mã OTP để hoàn tất đăng ký của bạn là: "
                    + "<b style='color: blue; font-size: 20px;'>" + otp + "</b></p>"
                    + "<p>Mã này có hiệu lực trong <b>1 phút</b>. Vui lòng không cung cấp mã này cho bất kỳ ai.</p>"
                    + "<br/>"
                    + "<p>Trân trọng,<br/>Đội ngũ hỗ trợ Pharmacy.</p>";

            helper.setText(htmlContent, true); // true nghĩa là gửi dưới dạng HTML

            mailSender.send(message);

        } catch (MessagingException e) {
            log.info("Service: errrrr: {}", to);
             throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }

    }
    public void sendNewPasswordEmail(String to, String newPassword) {
        log.info("Service: Sending new password to email: {}", to);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("lethai035600@gmail.com");
            helper.setTo(to);
            helper.setSubject("MẬT KHẨU MỚI - KHÔI PHỤC TÀI KHOẢN PHARMACY");

            // Giao diện HTML thông báo mật khẩu mới
            String htmlContent = "<h3>Yêu cầu khôi phục mật khẩu thành công!</h3>"
                    + "<p>Chào bạn, hệ thống đã cấp lại mật khẩu mới cho tài khoản của bạn.</p>"
                    + "<p>Mật khẩu mới của bạn là: "
                    + "<b style='color: #2c3e50; background-color: #f8f9fa; padding: 5px 10px; border: 1px dashed #bdc3c7; font-size: 18px;'>"
                    + newPassword + "</b></p>"
                    + "<p style='color: red;'><b>Lưu ý quan trọng:</b> Vì lý do bảo mật, vui lòng tiến hành đăng nhập và <b>đổi lại mật khẩu mới ngay lập tức</b> sau khi truy cập vào hệ thống.</p>"
                    + "<br/>"
                    + "<p>Trân trọng,<br/>Đội ngũ hỗ trợ Pharmacy.</p>";

            helper.setText(htmlContent, true); // true nghĩa là gửi dưới dạng HTML

            mailSender.send(message);
            log.info("Service: New password email sent successfully to: {}", to);

        } catch (MessagingException e) {
            log.error("Service: Error sending new password email to {}: {}", to, e.getMessage());
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
    }
}