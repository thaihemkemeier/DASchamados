package br.com.sistemas.chamados.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transaction;

import br.com.sistemas.chamados.dto.ClienteRequest;
import br.com.sistemas.chamados.dto.ClienteResponse;
import br.com.sistemas.chamados.entity.Cliente;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.RegraNegocioException;
import br.com.sistemas.chamados.repository.ClienteRepository;

@Service
public class ClienteService {

    private final ClienteRepository repository;

    public ClienteService(ClienteRepository repository){
        this.repository = repository;
    }
@Transactional
public ClienteResponse criar(ClienteRequest dto){
    if (repository.existsByEmail(dto.email())){
        throw new RegraNegocioException("Já existe cliente com o e-mail"+dto.email());
    }
    Cliente salvo = repository.save(new Cliente(dto.nome(), dto.email(), dto.telefone()));
    return ClienteResponse.de(salvo);
}
@Transactional(realOnly =true)
public List<ClienteResponse> listar(){
    return repository.findAll().map(ClienteResponse::de).toList();

}
@Transactional(realOnly =true)
public ClienteResponse buscar(Long id){
    return ClienteResponse.de(buscarEntity(id));
    }



}