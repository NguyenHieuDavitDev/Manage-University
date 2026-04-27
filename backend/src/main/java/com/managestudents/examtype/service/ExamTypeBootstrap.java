package com.managestudents.examtype.service;

import com.managestudents.examtype.entity.ExamType;
import com.managestudents.examtype.repository.ExamTypeRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class ExamTypeBootstrap implements ApplicationRunner {

    private final ExamTypeRepository examTypeRepository;

    public ExamTypeBootstrap(ExamTypeRepository examTypeRepository) {
        this.examTypeRepository = examTypeRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (examTypeRepository.count() > 0) {
            return;
        }
        examTypeRepository.saveAll(List.of(
                build("GK", "Giữa kỳ", "Kỳ thi/kiểm tra giữa kỳ"),
                build("CK", "Cuối kỳ", "Kỳ thi/kiểm tra cuối kỳ"),
                build("TL", "Thi lại", "Kỳ thi cải thiện hoặc thi lại")
        ));
    }

    private static ExamType build(String code, String name, String description) {
        ExamType e = new ExamType();
        e.setExamTypeCode(code);
        e.setExamTypeName(name);
        e.setDescription(description);
        return e;
    }
}
