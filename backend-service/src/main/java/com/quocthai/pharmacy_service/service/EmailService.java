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
}