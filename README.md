# DASchamados
DASchamados-main/
├── README.md
├── mvnw
├── mvnw.cmd
├── pom.xml
├── requests-chamados.http
└── src/
    ├── main/
    │   ├── java/br/com/sistemas/chamados/
    │   │   ├── ChamadosApplication.java
    │   │   ├── controller/
    │   │   │   ├── CategoriaController.java
    │   │   │   ├── ChamadoController.java
    │   │   │   ├── ClienteController.java
    │   │   │   └── TecnicoController.java
    │   │   ├── dto/
    │   │   │   ├── AlterarStatusRequest.java
    │   │   │   ├── AtribuirTecnicoRequest.java
    │   │   │   ├── AtualizarChamadoRequest.java
    │   │   │   ├── CategoriaRequest.java
    │   │   │   ├── CategoriaResponse.java
    │   │   │   ├── ChamadoDetalheResponse.java
    │   │   │   ├── ChamadoRequest.java
    │   │   │   ├── ChamadoResponse.java
    │   │   │   ├── ClienteRequest.java
    │   │   │   ├── ClienteResponse.java
    │   │   │   ├── ComentarioRequest.java
    │   │   │   ├── ComentarioResponse.java
    │   │   │   ├── PaginaResponse.java
    │   │   │   ├── TecnicoRequest.java
    │   │   │   └── TecnicoResponse.java
    │   │   ├── entity/
    │   │   │   ├── Categoria.java
    │   │   │   ├── Chamado.java
    │   │   │   ├── Cliente.java
    │   │   │   ├── Comentario.java
    │   │   │   ├── Perfil.java
    │   │   │   ├── Prioridade.java
    │   │   │   ├── StatusChamado.java
    │   │   │   └── Tecnico.java
    │   │   ├── exception/
    │   │   │   ├── ChamadoFechadoException.java
    │   │   │   ├── ErroResposta.java
    │   │   │   ├── GlobalExceptionHandler.java
    │   │   │   ├── RecursoNaoEncontradoException.java
    │   │   │   └── RegraNegocioException.java
    │   │   ├── repository/
    │   │   │   ├── CategoriaRepository.java
    │   │   │   ├── ChamadoRepository.java
    │   │   │   ├── ClienteRepository.java
    │   │   │   ├── ComentarioRepository.java
    │   │   │   └── TecnicoRepository.java
    │   │   └── service/
    │   │       ├── CategoriaService.java
    │   │       ├── ChamadoService.java
    │   │       ├── ClienteService.java
    │   │       └── TecnicoService.java
    │   └── resources/
    │       ├── application.properties
    │       └── static/                  ← FRONT (novo)
    │           ├── index.html
    │           ├── css/
    │           │   └── style.css
    │           └── js/
    │               └── app.js
    └── test/java/br/com/sistemas/chamados/
        ├── ChamadosApplicationTests.java
        ├── controller/
        │   ├── ChamadoControllerTest.java
        │   └── ClienteControllerTest.java
        ├── repository/
        │   ├── ChamadoRepositoryTest.java
        │   └── ClienteRepositoryTest.java
        └── service/
            └── ChamadoServiceTest.java
