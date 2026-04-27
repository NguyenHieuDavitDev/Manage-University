package com.managestudents.studentgrade.dto;

import java.util.ArrayList;
import java.util.List;

public class StudentGradebookResponse {

    private Long courseClassId;
    private String courseCode;
    private String courseName;
    private String sectionCode;
    private String className;
    private String academicYear;
    private Integer semester;
    private boolean gradebookFinalized;
    private List<StudentGradebookComponentResponse> components = new ArrayList<>();
    private List<StudentGradebookRowResponse> students = new ArrayList<>();

    public Long getCourseClassId() {
        return courseClassId;
    }

    public void setCourseClassId(Long courseClassId) {
        this.courseClassId = courseClassId;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getSectionCode() {
        return sectionCode;
    }

    public void setSectionCode(String sectionCode) {
        this.sectionCode = sectionCode;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public boolean isGradebookFinalized() {
        return gradebookFinalized;
    }

    public void setGradebookFinalized(boolean gradebookFinalized) {
        this.gradebookFinalized = gradebookFinalized;
    }

    public List<StudentGradebookComponentResponse> getComponents() {
        return components;
    }

    public void setComponents(List<StudentGradebookComponentResponse> components) {
        this.components = components;
    }

    public List<StudentGradebookRowResponse> getStudents() {
        return students;
    }

    public void setStudents(List<StudentGradebookRowResponse> students) {
        this.students = students;
    }
}
