document.getElementById('cadastrar_video').addEventListener('click', function () {
    criarNovo();
});

fetch('/contar-videos')
    .then(res => res.json())
    .then(dados => {
        document.getElementById("contador").textContent = dados.total;
    });




listaVideos()

function listaVideos() {
    const container = document.getElementById("tabela-relatorio");
    container.innerHTML = `
    <table class="tabela-relatorio">
      <thead>
        <tr>
          <th>ID</th>
          <th>Título</th>
          <th>Ouvir Resumo</th>
          <th>Link Vídeo</th>
          <th>Link Artigo</th>         
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
    fetch('/listar_videos')
        .then(res => res.json())
        .then(lista => {
            const tbody = container.querySelector("tbody");
            if (!lista.length) {
                tbody.innerHTML = "<tr><td colspan='6'>Nenhum vídeo cadastrado.</td></tr>";
                return;
            }
            lista.forEach(video => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
    <td>${video.id}</td>
    <td>${video.titulo}</td>
    <td>
      <button class="ler" data-id="${video.id}">
        <img src="imagens/speaker-high.svg" alt="Ouvir resumo" style="width: 16px; height: 16px;">
      </button>
    </td>
    <td>${video.link_video ? `<a href="${video.link_video}" target="_blank" class="link-contador" data-id="${video.id}">Ver vídeo</a>` : ""}</td>
    <td>${video.link_artigo ? `<a href="${video.link_artigo}" target="_blank" class="link-contador" data-id="${video.id}">Ver artigo</a>` : ""}</td>
  `;

                // 🎧 Botão de ouvir resumo
                const botaoOuvir = tr.querySelector(".ler");
                botaoOuvir.addEventListener("click", function (event) {
                    event.stopPropagation();
                    const id = this.dataset.id;
                    ouvirResumo(id);
                });

                // 🚫 Impede que clique no link propague para o tr
                tr.querySelectorAll("a").forEach(link => {
                    link.addEventListener("click", e => e.stopPropagation());
                });

                // 🟢 Abre modal ao clicar na linha
                tr.addEventListener("click", () => abrirModal(video));

                tbody.appendChild(tr);
                // 🔄 Contador de cliques em links de vídeo ou artigo
                tr.querySelectorAll(".link-contador").forEach(link => {
                    link.addEventListener("click", function () {
                        const id = this.dataset.id;
                        fetch(`/incrementar-clique/${id}`, { method: 'POST' });
                    });
                });
            });

        })
        .catch(err => {
            console.error("Erro ao buscar vídeos:", err);
            const tbody = container.querySelector("tbody");
            tbody.innerHTML = "<tr><td colspan='6'>Erro ao buscar vídeos.</td></tr>";
        });
}

function abrirModal(dados) {
    document.getElementById("divExcluir").style.display = "block";
    const modal = document.getElementById("modal");
    const conteudo = document.getElementById("conteudoModal");

    conteudo.innerHTML = `
      <strong>Título:</strong> <br>
      <div class="flex-esquerda">
          <input class="input_medio" type="text" id="titulo_video" placeholder="Título do vídeo" value="${dados.titulo || ''}" autocomplete="off" required> <br>
          <div class="distancia_esquerda">
              <strong>ID:</strong>
              <span>${dados.id || ''}</span>
          </div>
          
      </div>
      <strong>Link do vídeo:</strong>
      <div class="flex-esquerda">
          <input class="input_medio" type="text" id="link_video" placeholder="Insira o link do vídeo" value="${dados.link_video || ''}" autocomplete="off" required>                         
          <button id="acessar_video" type="button">Acessar vídeo</button>
          
      </div>
      <strong>Link do artigo:</strong>
      <div class="flex-esquerda">
          <input class="input_medio" type="text" id="link_artigo" placeholder="Insira o link do artigo" value="${dados.link_artigo || ''}" autocomplete="off" required>    
          <button id="acessar_artigo" type="button">Acessar artigo</button>
          
      </div>  
      <p><strong>Resumo:</strong></p>
      <span>${dados.resumo || ''}</span>              
      <p><strong>Descrição:</strong></p>
      <textarea id="descricaoEditavel" rows="4" required>${dados.descricao || ''}</textarea>
  `;

    modal.style.display = "flex";

    // Gerenciar o botão Salvar (libera só se algum campo mudar)
    gerenciarBotaoSalvar(
        {
            titulo: 'titulo_video',
            link_video: 'link_video',
            link_artigo: 'link_artigo',
            descricao: 'descricaoEditavel'
        },
        'salvarEdicao',
        {
            titulo: dados.titulo || '',
            link_video: dados.link_video || '',
            link_artigo: dados.link_artigo || '',
            descricao: dados.descricao || ''
        }
    );

    document.getElementById('excluirEdicao').onclick = async function () {
        if (!confirm("Tem certeza que deseja excluir este vídeo?")) return;

        try {
            const res = await fetch('/excluir_video', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: dados.id })
            });

            if (res.ok) {
                alert("✅ Vídeo excluído com sucesso!");
                document.getElementById("modal").style.display = "none";
                listaVideos();
            } else {
                alert("❌ Erro ao excluir vídeo.");
            }
        } catch (err) {
            alert('❌ Erro de conexão ao excluir vídeo.');
            console.error(err);
        }
    };

    document.getElementById("acessar_video").addEventListener("click", () => {
        const link = document.getElementById("link_video").value.trim();
        if (link) {
            fetch(`/incrementar-clique/${dados.id}`, { method: 'POST' }); // contador
            window.open(link, "_blank");
        } else {
            alert("🔗 Nenhum link de vídeo foi inserido.");
        }
    });

    document.getElementById("acessar_artigo").addEventListener("click", () => {
        const link = document.getElementById("link_artigo").value.trim();
        if (link) {
            fetch(`/incrementar-clique/${dados.id}`, { method: 'POST' }); // contador
            window.open(link, "_blank");
        } else {
            alert("🔗 Nenhum link de artigo foi inserido.");
        }
    });

    document.getElementById('formEditarDescricao').onsubmit = async function (event) {
        event.preventDefault();

        const dadosEditados = {
            id: dados.id,
            titulo: document.getElementById("titulo_video").value,
            link_video: document.getElementById("link_video").value,
            link_artigo: document.getElementById("link_artigo").value,
            descricao: document.getElementById("descricaoEditavel").value
        };

        try {
            document.getElementById("modal").style.display = "none";
            const res = await fetch('/atualizar_video', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosEditados)
            });

            if (res.ok) {
                alert('✅ Vídeo atualizado com sucesso!');
                listaVideos();
            } else {
                alert('❌ Erro ao atualizar vídeo.');
            }
        } catch (err) {
            alert('❌ Erro ao atualizar vídeo.');
            console.error(err);
        }
    };


}



function criarNovo() {
    const modal = document.getElementById("modal");
    const conteudo = document.getElementById("conteudoModal");
    document.getElementById("divExcluir").style.display = "none";


    conteudo.innerHTML = `
        <strong>Título:</strong> <br>
        <input class="input_medio" type="text" id="titulo_video" placeholder="Título do vídeo" autocomplete="off" required><br>
        <strong>Link do vídeo:</strong>
        <div class="flex-esquerda">
            <input class="input_medio" type="text" id="link_video" placeholder="Insira o link do vídeo" autocomplete="off" required>
            <button id="acessar_video" type="button">Acessar vídeo</button>            
        </div>
        <strong>Link do artigo:</strong>
        <div class="flex-esquerda">
            <input class="input_medio" type="text" id="link_artigo" placeholder="Insira o link do artigo" autocomplete="off" required>
            <button id="acessar_artigo" type="button">Acessar artigo</button>            
        </div>                
        <p><strong>Descrição:</strong></p>
        <textarea id="descricaoEditavel" rows="7" required></textarea>

    `;
    modal.style.display = "flex";

    // Libera o botão salvar só se algum campo for preenchido (ou mudar)
    gerenciarBotaoSalvar(
        {
            titulo: 'titulo_video',
            link_video: 'link_video',
            link_artigo: 'link_artigo',
            descricao: 'descricaoEditavel'
        },
        'salvarEdicao',
        {
            titulo: '',
            link_video: '',
            link_artigo: '',
            descricao: ''
        }
    );

    // Evento para o formulário de cadastro
    document.getElementById('formEditarDescricao').onsubmit = async function (event) {
        event.preventDefault();

        const titulo = document.getElementById("titulo_video").value;
        const link_video = document.getElementById("link_video").value;
        const link_artigo = document.getElementById("link_artigo").value;
        const descricao = document.getElementById("descricaoEditavel").value;

        try {
            document.getElementById("modal").style.display = "none";
            const res = await fetch('/cadastrar_video', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ titulo, link_video, link_artigo, descricao })
            });

            if (res.ok) {
                alert('✅ Vídeo cadastrado com sucesso!');
                listaVideos();
            } else {
                alert('❌ Erro ao cadastrar vídeo.');
            }
        } catch (err) {
            alert('❌ Erro de conexão ao cadastrar vídeo.');
            console.error(err);
        }
    };
}




// salvar dados da alteração



function gerenciarBotaoSalvar(campos, btnId, valoresOriginais = {}) {
    const botoao = document.getElementById(btnId);

    function atualizarEstado() {
        let algumDiferente = false;
        for (let id of Object.keys(campos)) {
            const campo = document.getElementById(campos[id]);
            const valorAtual = (campo.value || '').trim();
            const valorOriginal = (valoresOriginais[id] || '').trim();
            if (valorAtual !== valorOriginal) {
                algumDiferente = true;
                break;
            }
        }
        if (algumDiferente) {
            botoao.disabled = false;
            botoao.classList.remove('desativado');
        } else {
            botoao.disabled = true;
            botoao.classList.add('desativado');
        }
    }

    // Estado inicial:
    atualizarEstado();

    // Eventos ao digitar em qualquer campo:
    Object.values(campos).forEach(id => {
        document.getElementById(id).addEventListener('input', atualizarEstado);
    });
}

function ouvirResumo(id, event) {

    console.log('passou no front')
    fetch(`/ouvir-resumo/${id}`)
        .then(r => r.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            new Audio(url).play();
        });
}

document.getElementById('fecharBotao').addEventListener("click", () => {
    document.getElementById("modal").style.display = "none";
});

// buscar vídeo

document.getElementById("lupa").addEventListener("click", async () => {
    const termo = document.getElementById("inputBuscaTicket").value.trim();

    // Se o campo estiver vazio, apenas lista todos os vídeos
    if (!termo) {
        listaVideos();
        return;
    }

    // Caso contrário, faz a busca por embedding
    const res = await fetch("/buscar-video-embedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: termo })
    });

    if (!res.ok) return alert("Erro ao buscar vídeos.");

    const recomendacoes = await res.json();
    renderizarTabelaRecomendacoes(recomendacoes);


});

document.getElementById("inputBuscaTicket").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("lupa").click();
    }
});



function renderizarTabelaRecomendacoes(lista) {
    const container = document.getElementById("tabela-relatorio");
    container.innerHTML = `
    <table class="tabela-relatorio">
      <thead>
        <tr>
          <th>ID</th>
          <th>Título</th>
          <th>Ouvir Resumo</th>
          <th>Link Vídeo</th>
          <th>Link Artigo</th>
          <th>Aproximação</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

    const tbody = container.querySelector("tbody");
    if (!lista.length) {
        tbody.innerHTML = "<tr><td colspan='6'>Nenhum vídeo recomendado.</td></tr>";
        return;
    }

    lista.forEach(video => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${video.id}</td>
      <td>${video.titulo}</td>
      <td>
        <button class="ler" data-id="${video.id}">
          <img src="imagens/speaker-high.svg" alt="Ouvir resumo" style="width: 16px; height: 16px;">
        </button>
      </td>
      <td>${video.link_video ? `<a href="${video.link_video}" target="_blank" class="link-contador" data-id="${video.id}">Ver vídeo</a>` : ""}</td>
      <td>${video.link_artigo ? `<a href="${video.link_artigo}" target="_blank" class="link-contador" data-id="${video.id}">Ver artigo</a>` : ""}</td>     
      <td>${((video.score - 0.5) * 1000).toFixed(1)}</td>


    `;
        // 🎧 Botão de ouvir resumo
        const botaoOuvir = tr.querySelector(".ler");
        botaoOuvir.addEventListener("click", function (event) {
            event.stopPropagation();
            const id = this.dataset.id;
            ouvirResumo(id);
        });


        // 🚫 Impede propagação dos links
        tr.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", e => e.stopPropagation());
        });

        // 🔄 Contador de cliques
        tr.querySelectorAll(".link-contador").forEach(link => {
            link.addEventListener("click", function () {
                const id = this.dataset.id;
                fetch(`/incrementar-clique/${id}`, { method: 'POST' });
            });
        });

        tr.addEventListener("click", () => abrirModal(video));
        tbody.appendChild(tr);
    });
}

function mostrarFeedback(event) {
    event.preventDefault(); // Impede navegação

    const elemento = document.getElementById("mensagem-feedback");
    const textoOriginal = elemento.innerHTML;

    // Altera o conteúdo e a cor
    elemento.innerHTML = `<span style="color: green;">Obrigado pelo feedback</span>`;

    // Após 3 segundos, retorna ao original
    setTimeout(() => {
        elemento.innerHTML = textoOriginal;
    }, 3000);
}


function enviarFeedback(event) {
    console.log("oi 4500")
    event.preventDefault();

    const input = document.getElementById("inputBuscaTicket");
    const inputBusca = input ? input.value.trim() : "";

    if (!inputBusca) return;

    // envia para o backend
    fetch("/salvar-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_busca: inputBusca })
    }).then(res => {
        if (res.ok) {
            const el = document.getElementById("mensagem-feedback");
            const original = el.innerHTML;
            el.innerHTML = `<span style="color: green;">Obrigado pelo feedback</span>`;
            setTimeout(() => {
                el.innerHTML = original;
            }, 3000);
        }
    }).catch(err => {
        console.error("Erro ao enviar feedback:", err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("feedbackLink").addEventListener("click", enviarFeedback);
});



//<td>${((video.score - 0.80) * 1000).toFixed(1)}%</td>

//<td>${((video.score - 0.794) * 1000).toFixed(1)}</td>


