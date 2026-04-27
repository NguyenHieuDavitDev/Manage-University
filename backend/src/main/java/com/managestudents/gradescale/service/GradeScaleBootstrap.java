package com.managestudents.gradescale.service;

import com.managestudents.gradescale.entity.GradeScale;
import com.managestudents.gradescale.repository.GradeScaleRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
public class GradeScaleBootstrap implements ApplicationRunner {

    private final GradeScaleRepository gradeScaleRepository;

    public GradeScaleBootstrap(GradeScaleRepository gradeScaleRepository) {
        this.gradeScaleRepository = gradeScaleRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (gradeScaleRepository.count() > 0) return;
        gradeScaleRepository.saveAll(List.of(
                build("A", "8.5", "10.0", "Xuất sắc"),
                build("B", "7.0", "8.49", "Khá"),
                build("C", "5.5", "6.99", "Trung bình"),
                build("D", "4.0", "5.49", "Yếu"),
                build("F", "0.0", "3.99", "Không đạt")
        ));
    }

    private static GradeScale build(String letter, String min, String max, String desc) {
        GradeScale e = new GradeScale();
        e.setLetterGrade(letter);
        e.setMinScore(new BigDecimal(min));
        e.setMaxScore(new BigDecimal(max));
        e.setDescription(desc);
        return e;
    }
}
