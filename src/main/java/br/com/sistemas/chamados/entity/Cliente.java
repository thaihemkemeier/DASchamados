package br.com.sistemas.chamados.entity;

importjakarta.persistence.Column;
importjakarta.persistence.Entity;
importjakarta.persistence.GeneratedValue;
importjakarta.persistence.GenerationType;
importjakarta.persistence.Id;
importjakarta.persistence.Table;

/**ENTITY:representa a tabela do banco. Cada objeto = uma linha. */
@Entity
@Table(name="clientes")
public class cliente {

    @Id
    @GeneratedValue9(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length =120)
    private String email;

    @Column(length = 20)
    private String telefone;

    public cliente() {}

    public Cliente(String nome, String email, String telefone) {
        this.name = nome;
        this.email = email;
        this.telefone = telefone;
    }

    public Long getld() { return id; }
    public String getNome() {return nome;}
    public void setNome(String nome) { this.nome = nome;}
    public String getEmail() {return email;}
    public void setEmail(String email) { this.email = email;}
    public String getTelefone() {return telefone;}
    public void setTelefone(String telefone) {this.telefone =telefone;}

}
