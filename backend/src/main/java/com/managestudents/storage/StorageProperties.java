package com.managestudents.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    /**
     * Thư mục con (trong thư mục làm việc của app) để lưu avatar.
     * Ví dụ: {@code data/uploads/avatars}
     */
    private String avatarsSubdir = "data/uploads/avatars";

    /**
     * Thư mục lưu file đính kèm chứng chỉ (pdf, ảnh scan, …).
     */
    private String credentialsSubdir = "data/uploads/credentials";

    private String insurancesSubdir = "data/uploads/insurances";

    private String laborContractsSubdir = "data/uploads/labor-contracts";

    private String researchWorksSubdir = "data/uploads/research-works";

    public String getAvatarsSubdir() {
        return avatarsSubdir;
    }

    public void setAvatarsSubdir(String avatarsSubdir) {
        this.avatarsSubdir = avatarsSubdir;
    }

    public String getCredentialsSubdir() {
        return credentialsSubdir;
    }

    public void setCredentialsSubdir(String credentialsSubdir) {
        this.credentialsSubdir = credentialsSubdir;
    }

    public String getInsurancesSubdir() {
        return insurancesSubdir;
    }

    public void setInsurancesSubdir(String insurancesSubdir) {
        this.insurancesSubdir = insurancesSubdir;
    }

    public String getLaborContractsSubdir() {
        return laborContractsSubdir;
    }

    public void setLaborContractsSubdir(String laborContractsSubdir) {
        this.laborContractsSubdir = laborContractsSubdir;
    }

    public String getResearchWorksSubdir() {
        return researchWorksSubdir;
    }

    public void setResearchWorksSubdir(String researchWorksSubdir) {
        this.researchWorksSubdir = researchWorksSubdir;
    }
}
