package br.com.sistemas.chamados.repository;

import br.com.sistemas.chamados.entity;
import org.springframework.data.jpa.repository.JapRepository;

public interface ClienteRepository extends JapRepository<Cliente, Long> {

    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);

}