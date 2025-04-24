describe('Login e acesso ao cadastro de ticket - Locsis', () => {
  Cypress.on('uncaught:exception', (err, runnable) => {
    return false; // Ignora erros JS da aplicação
  });

  it('Deve logar, acessar a tela de cadastro, preencher razão social e link do chamado', () => {
    cy.viewport(1920, 1080);

    cy.visit('http://localhost:3000/login');
    cy.wait(500);

    cy.get('#email').type('diego.rocha@sisloc.com.br');
    cy.get('#senha').type('450012');
    cy.wait(300);

    cy.get('form').submit();
    cy.wait(800);

    cy.url().should('include', '/dashboard');
    cy.wait(500);

    cy.get('#cadastrar-ticket').click();
    cy.wait(800);

    cy.url().should('include', '/ticket');

    // Digita no campo Razão Social
    cy.get('#razao_social')
      .click()
      .type('BOTULOC LOCACOES E PINTURAS LTDA - 20.251.616/0001-42');

    // Aguarda e clica na sugestão
    cy.contains('#sugestoes div', 'BOTULOC LOCACOES E PINTURAS LTDA - 20.251.616/0001-42')
      .should('be.visible')
      .click();

   // Aguarda o campo chamado ficar 100% interagível
// Aguarda até que o campo chamado esteja pronto para interação
cy.get('#chamado', { timeout: 5000 }) // espera até 5 segundos
  .should('exist')
  .should('be.visible')
  .should('not.be.disabled')
  .then(($el) => {
    // Confirma se não está readonly
    const isReadOnly = $el.prop('readonly');
    if (!isReadOnly) {
      cy.wrap($el)
        .click()
        .type('https://chat.azpost.com.br/app/accounts/18/conversations/3832');
    } else {
      throw new Error('#chamado está readonly no momento da digitação.');
    }
  });
  // Seleciona a opção "Dúvida" no select de tipo
cy.get('#tipo')
.should('be.visible')
.select('duvida');

// Aguarda o select de status aparecer e seleciona "Aberto"
cy.get('#status', { timeout: 5000 })
  .should('exist')
  .should('be.visible')
  .select('aberto'); // valor do option no HTML

  cy.contains('#menu_duvida div', 'contrato')
      .should('be.visible')
      .click();

 


  });
});
