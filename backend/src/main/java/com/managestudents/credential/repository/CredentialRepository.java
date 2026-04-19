package com.managestudents.credential.repository;

import com.managestudents.credential.entity.Credential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CredentialRepository extends JpaRepository<Credential, Long>, JpaSpecificationExecutor<Credential> {

    @Query("select distinct c.credentialCategory from Credential c order by c.credentialCategory asc")
    List<String> findDistinctCredentialCategories();
}
