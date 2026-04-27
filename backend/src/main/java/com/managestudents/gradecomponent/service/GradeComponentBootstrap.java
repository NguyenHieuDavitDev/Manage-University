package com.managestudents.gradecomponent.service;

import com.managestudents.gradecomponent.entity.GradeComponent;
import com.managestudents.gradecomponent.repository.GradeComponentRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class GradeComponentBootstrap implements ApplicationRunner {

    private final GradeComponentRepository gradeComponentRepository;

    public GradeComponentBootstrap(GradeComponentRepository gradeComponentRepository) {
        this.gradeComponentRepository = gradeComponentRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (gradeComponentRepository.count() > 0) {
            return;
        }
        List<GradeComponent> defaults = List.of(
                build("CC", "Chuyên cần", "Điểm đánh giá mức độ tham gia học tập trên lớp", 10),
                build("GK", "Giữa kỳ", "Điểm thi hoặc kiểm tra giữa kỳ", 20),
                build("TX", "Điểm thường xuyên", "Điểm kiểm tra ngắn, bài tập, thảo luận", 20),
                build("CK", "Cuối kỳ", "Điểm thi hoặc đánh giá cuối kỳ", 50));
        gradeComponentRepository.saveAll(defaults);
    }

    private static GradeComponent build(String code, String name, String description, Integer weightPercent) {
        GradeComponent c = new GradeComponent();
        c.setComponentCode(code);
        c.setComponentName(name);
        c.setDescription(description);
        c.setWeightPercent(weightPercent);
        return c;
    }
}
