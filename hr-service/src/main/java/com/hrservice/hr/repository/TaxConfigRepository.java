package com.hrservice.hr.repository;

import com.hrservice.hr.entity.TaxConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaxConfigRepository extends JpaRepository<TaxConfig, Long> {

    List<TaxConfig> findByYearAndCountry(Integer year, String country);

    List<TaxConfig> findByYearAndCountryAndIsActiveTrue(Integer year, String country);

    Optional<TaxConfig> findTopByYearAndCountryAndIsActiveTrueOrderByMinBracketDesc(
            Integer year, String country);

    List<TaxConfig> findByCountryOrderByYearDescMinBracketAsc(String country);
}
