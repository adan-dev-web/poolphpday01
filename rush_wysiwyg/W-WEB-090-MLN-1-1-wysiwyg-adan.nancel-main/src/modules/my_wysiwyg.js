export class MyWysiwyg {
  constructor(element, options = {}) {
    this.element = element;

    this.defaultOptions = {
      buttons: ["bold", "italic", "strikethrough", "color", "fontSize", "link"],
      autoSaveInterval: 5,
      containerWidth: "800px",
      containerHeight: "400px",
    };

    this.options = { ...this.defaultOptions, ...options };
    this.lastSavedContent = "";
    this.addStyles();
    this.init();
  }

  init() {
    // Inicializa el editor avec tous les éléments et les événements
    this.container = document.createElement("div");
    this.container.className = "wysiwyg-container";
    this.container.style.width = this.options.containerWidth;
    this.container.style.height = this.options.containerHeight;

    this.toolbar = document.createElement("div");
    this.toolbar.className = "wysiwyg-toolbar";

    this.editor = document.createElement("div");
    this.editor.className = "wysiwyg-editor";
    this.editor.contentEditable = true;

    this.setupEditor();
    this.createToolbar();
    this.setupAutoSave();
    this.setupEvents();

    this.container.appendChild(this.toolbar);
    this.container.appendChild(this.editor);
    this.element.parentNode.replaceChild(this.container, this.element);

    this.loadSavedContent();
  }

  createToolbar() {
    const buttonConfigs = {
      bold: {
        icon: "<strong>B</strong>",
        tooltip: "Gras",
      },

      italic: {
        icon: "<em>I</em>",
        tooltip: "Italic",
      },

      strikethrough: {
        icon: '<span style="text-decoration: line-through">S</span>',
        tooltip: "Barré",
      },

      color: {
        icon: "🎨",
        tooltip: "Couleur",
      },

      fontSize: {
        icon: "T↕",
        tooltip: "Taille police",
      },
      link: {
        icon: "🔗",
        tooltip: "Lien",
      },
      alignLeft: {
        icon: "⇤",
        tooltip: "Gauche",
      },

      alignCenter: {
        icon: "☰",
        tooltip: "Centré",
      },

      alignRight: {
        icon: "⇥",
        tooltip: "Droite",
      },

      justify: {
        icon: "⇟",
        tooltip: "Justifier",
      },
      source: {
        icon: "&lt;/&gt;",
        tooltip: "Code",
      },
      save: {
        icon: "💾",
        tooltip: "Sauvegarder",
      },
    };

    this.options.buttons.forEach((buttonName) => {
      if (buttonConfigs[buttonName]) {
        const button = document.createElement("button");
        button.className = "wysiwyg-button";
        button.innerHTML = buttonConfigs[buttonName].icon;
        button.title = buttonConfigs[buttonName].tooltip;
        button.addEventListener("click", () => this.executeCommand(buttonName));
        this.toolbar.appendChild(button);
      }
    });
  }

  executeCommand(command) {
    switch (command) {
      case "bold":
      case "italic":

      case "strikethrough":
        this.toggleStyle(command);
        break;

      case "color":
        this.showColorPicker();
        break;

      case "fontSize":
        this.showFontSizeMenu();
        break;

      case "link":
        this.createLink();
        break;

      case "source":
        this.toggleSource();
        break;

      case "alignLeft":
      case "alignCenter":
      case "alignRight":

      case "justify":
        this.align(command.replace("align", "").toLowerCase());
        break;

      case "save":
        this.saveContent();
        break;
    }
  }

  toggleStyle(style) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let effectiveNode = range.commonAncestorContainer;

    if (effectiveNode.nodeType === 3) {
      effectiveNode = effectiveNode.parentNode;
    }

    const hasStyle = this.checkStyleApplied(effectiveNode, style);

    if (hasStyle) {
      this.removeStyle(effectiveNode, style, range);
    } else {
      this.applyStyle(style, range);
    }
  }

  checkStyleApplied(node, style) {
    if (node.nodeType === 3) return false;

    switch (style) {
      case "bold":
        return (
          node.style.fontWeight === "bold" ||
          node.tagName === "STRONG" ||
          node.tagName === "B"
        );
      case "italic":
        return (
          node.style.fontStyle === "italic" ||
          node.tagName === "EM" ||
          node.tagName === "I"
        );
      case "strikethrough":
        return (
          node.style.textDecoration === "line-through" || node.tagName === "S"
        );
      default:
        return false;
    }
  }

  applyStyle(style, range) {
    const span = document.createElement("span");

    switch (style) {
      case "bold":
        span.style.fontWeight = "bold";
        break;
      case "italic":
        span.style.fontStyle = "italic";
        break;
      case "strikethrough":
        span.style.textDecoration = "line-through";
        break;
    }

    const content = range.extractContents();
    span.appendChild(content);
    range.insertNode(span);

    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  removeStyle(node, style, range) {
    if (node === this.editor) return;

    const parentNode = node.parentNode;
    const content = node.textContent;
    const textNode = document.createTextNode(content);

    parentNode.replaceChild(textNode, node);

    const newRange = document.createRange();
    newRange.setStart(textNode, 0);
    newRange.setEnd(textNode, content.length);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  showColorPicker() {
    const colorPicker = document.createElement("input");
    colorPicker.type = "color";

    // pour gere le changement de couleur
    colorPicker.addEventListener("change", (e) => {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      let effectiveNode = range.commonAncestorContainer;

      if (effectiveNode.nodeType === 3) {
        effectiveNode = effectiveNode.parentNode;
      }

      if (effectiveNode.style && effectiveNode.style.color) {
        this.removeStyle(effectiveNode, "color", range);
      } else {
        const span = document.createElement("span");
        span.style.color = e.target.value;
        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);
      }
    });
    colorPicker.click();
  }

  showFontSizeMenu() {
    // save la selection actuelle
    const savedSelection = window.getSelection().getRangeAt(0).cloneRange();

    // mmp
    const existingMenu = document.querySelector(".font-size-menu");
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    const menu = document.createElement("div");
    menu.className = "font-size-menu";

    // apres j'ai ajouter les tailles de police  jusqu'à 50px
    const sizes = [
      "8px",
      "10px",
      "12px",
      "14px",
      "16px",
      "18px",
      "20px",
      "24px",
    ];

    sizes.forEach((size) => {
      const option = document.createElement("div");
      option.textContent = size;
      option.style.fontSize = size; // montrer la taille de police actuelle

      option.className = "font-size-option";

      option.addEventListener("click", () => {
        // il va rsetore la selection actuelle
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedSelection);

        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const span = document.createElement("span");
          span.style.fontSize = size;

          // ici on va verifier si le parent de la selection est un span et il a la meme taille de police //
          const currentNode = range.commonAncestorContainer;
          const parentSpan =
            currentNode.nodeType === 3 ? currentNode.parentNode : currentNode;

          if (parentSpan.style && parentSpan.style.fontSize === size) {
            if (parentSpan !== this.editor) {
              // si le parent n'est pas l'editeur
              const text = parentSpan.textContent;
              const textNode = document.createTextNode(text);
              parentSpan.parentNode.replaceChild(textNode, parentSpan);
            }
          } else {
            // Aplicar nuevo tamaño
            span.appendChild(range.extractContents());
            range.insertNode(span);
          }
        }
        menu.remove();
      });
      menu.appendChild(option);
    });

    // Posicionar el menú cerca del botón
    const buttonRect = event.target.getBoundingClientRect();
    menu.style.position = "absolute";

    menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
    menu.style.left = `${buttonRect.left + window.scrollX}px`;

    document.body.appendChild(menu);

    // Cerrar el menú cuando se hace clic fuera
    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target !== event.target) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 0);
  }

  createLink() {
    const selection = window.getSelection();

    if (!selection.rangeCount) return;

    const url = prompt("Entrez l'URL:", "http://");
    if (url) {
      const range = selection.getRangeAt(0);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.appendChild(range.extractContents());
      range.insertNode(link);
    }
  }

  align(direction) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer;

    // Si estamos en un nodo de texto, obtenemos su padre
    if (container.nodeType === 3) {
      container = container.parentNode;
    }

    let blockElement = this.findClosestBlock(container);

    if (!blockElement || blockElement === this.editor) {
      // Si no hay bloque contenedor, creamos uno nuevo
      blockElement = document.createElement("div");
      blockElement.appendChild(range.extractContents());
      range.insertNode(blockElement);
    }

    if (blockElement.style.textAlign === direction) {
      blockElement.style.textAlign = ""; // Remover alineación , testeeear des pues IMPORTANTT ANUAR
    } else {
      blockElement.style.textAlign = direction;
    }

    // Mantener la selección
    this.preserveSelection(blockElement);
  }

  findClosestBlock(element) {
    const blockElements = [
      "DIV",
      "P",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "LI",
      "BLOCKQUOTE",
    ];

    while (element && element !== this.editor) {
      // tant que l'element n'est pas l'editeur
      if (blockElements.includes(element.nodeName)) {
        return element;
      }
      element = element.parentNode;
    }

    return null;
  }

  // Función auxiliar para preservar la selección
  preserveSelection(element) {
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  setupEditor() {
    // manejar el evento keydown por  nuevsssss parafos
    this.editor.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;

        // Encontrar el bloque actual --------------------------------------- important etape 1
        let currentBlock = this.findClosestBlock(container);

        // Crear nuevo párrafo
        const newBlock = document.createElement("div");
        newBlock.appendChild(document.createElement("br"));

        // Si hay un bloque actual, heredar su alineación ------------------------- important etape 2
        if (currentBlock && currentBlock.style.textAlign) {
          newBlock.style.textAlign = currentBlock.style.textAlign;
        }

        // Insertar el nuevo bloque ------------------------------------------- important etape 3
        if (currentBlock && currentBlock !== this.editor) {
          currentBlock.parentNode.insertBefore(
            newBlock,
            currentBlock.nextSibling
          );
        } else {
          this.editor.appendChild(newBlock);
        }

        // Mover el cursor al nuevo bloque
        const newRange = document.createRange();
        newRange.setStart(newBlock, 0);
        newRange.setEnd(newBlock, 0);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    });
  }

  // Añade esta función para toggleSource para cambiar entre el editor y la vista de código fuente , TESTTT IMPORTANT
  toggleSource() {
    if (this.sourceView) {
      this.editor.innerHTML = this.sourceView.value;
      this.sourceView.remove();
      this.sourceView = null;
      this.editor.style.display = "block";
    }

    // Si la vista de código fuente no existe, crearla ------------------  evitar errorrr
    else {
      this.sourceView = document.createElement("textarea");
      this.sourceView.className = "wysiwyg-source";
      this.sourceView.value = this.editor.innerHTML;
      this.editor.style.display = "none";
      this.container.appendChild(this.sourceView);
    }
  }

  setupEvents() {
    // Añade esta función para setupEvents para manejar eventos de pegado y Ctrl+S -------- apres CTRL + Z  , no oublie de l'ajouter dans INIIIIIIIT ----------------
    this.editor.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
    });

    this.editor.addEventListener("input", () => {
      this.hasUnsavedChanges(); // Esto actualizará automáticamente el indicador
    });

    // Detectar cuando se presiona Ctrl+S
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        this.saveContent();
      }
    });
  }

  // Añade esta función para loadSavedContent
  loadSavedContent() {
    try {
      const savedContent = localStorage.getItem("wysiwyg-content");
      if (savedContent) {
        this.editor.innerHTML = savedContent;
        this.lastSavedContent = savedContent;
      }
    } catch (error) {
      console.error("Erreur lors du chargement du contenu sauvegardé:", error);
    }
  }

  // Función auxiliar para verificar cambios sin guardar
  hasUnsavedChanges() {
    const hasChanges = this.editor.innerHTML !== this.lastSavedContent;
    // Actualizar la clase del contenedor según el estado
    if (hasChanges) {
      this.container.classList.add("has-changes");
    } else {
      this.container.classList.remove("has-changes");
    }
    return hasChanges;
  }

  setupAutoSave() {
    // Autoguardado periódico
    this.autoSaveInterval = setInterval(() => {
      if (this.hasUnsavedChanges()) {
        this.saveContent();
      }
    }, this.options.autoSaveInterval * 60 * 1000);

    // Alerta al cerrar
    window.addEventListener("beforeunload", (e) => {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue =
          "Vous avez des changements non enregistrés. Es-tu sûr de vouloir sortir";
        return e.returnValue;
      }
    });

    // Detectar cambios
    this.editor.addEventListener("input", () => {
      this.hasUnsavedChanges();
    });
  }

  saveContent() {
    try {
      localStorage.setItem("wysiwyg-content", this.editor.innerHTML);
      this.lastSavedContent = this.editor.innerHTML;
      this.container.classList.remove("has-changes"); // Asegura que esto se ejecute
      this.showMessage("Contenu sauvegardé avec succès", "success");
      return true;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      this.showMessage("Erreur lors de la sauvegarde du contenu", "error");
      return false;
    }
  }

  showMessage(text, type = "success") {
    const existingMessage = document.querySelector(".wysiwyg-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    const message = document.createElement("div");
    message.className = `wysiwyg-message wysiwyg-message-${type}`;
    message.textContent = text;
    document.body.appendChild(message);

    setTimeout(() => {
      message.classList.add("wysiwyg-message-fade");
      setTimeout(() => message.remove(), 300);
    }, 2000);
  }

  addStyles() {
    const styles = `
        .wysiwyg-container {
            border: 2px solid #891b1b;
            border-radius: 4px;
            margin: 20px 0;
            position: relative;
            transition: border-color 0.3s ease;
        }

        .has-changes::before {
            content: 'Cambios sin guardar';
            position: absolute;
            top: -25px;
            right: 10px;
            font-size: 12px;
            color: #856404;
            background-color: #fff3cd;
            padding: 2px 8px;
            border-radius: 4px;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }


        .wysiwyg-toolbar {
            padding: 10px;
            border-bottom: 1px solid #891b1b;
            background: #f8f9fa;
            display: flex;
            gap: 5px;
        }

        .wysiwyg-button {
            min-width: 35px;
            height: 35px;
            padding: 5px;
            border: 1px solid #891b1b;
            border-radius: 4px;
            cursor: pointer;
            background: white;
        }

        .wysiwyg-button:hover {
            background: #f0f0f0;
        }

        .wysiwyg-editor {
            min-height: 200px;
            padding: 15px;
            outline: none;
        }

        .wysiwyg-message {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 4px;
            color: white;
            z-index: 1000;
            transition: opacity 0.3s;
        }
        
        .wysiwyg-message-success {
            background-color: #28a745;
        }
        
        .wysiwyg-message-error {
            background-color: #dc3545;
        }
        
        .wysiwyg-message-fade {
            opacity: 0;
        }

        .font-size-menu {
            position: absolute;
            background: white;
            border: 1px solid #891b1b;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            border-radius: 4px;
            padding: 5px 0;
            z-index: 1000;
        }

        .font-size-option {
            padding: 8px 16px;
            cursor: pointer;
        }

        .font-size-option:hover {
            background: #f0f0f0;
        }
            
    .wysiwyg-source {
            width: 100%;
            min-height: 300px;
            padding: 15px;
            font-family: monospace;
            border: none;
            outline: none;
            resize: vertical;
            background: #f8f9fa;
            font-size: 14px;
        }

        .has-changes {
            border-color: #ffc107;
        }

        .has-changes::before {
            content: '⚠️ Cambios sin guardar';
            position: absolute;
            top: -20px;
            right: 10px;
            font-size: 12px;
            color: #856404;
            background-color: #fff3cd;
            padding: 2px 8px;
            border-radius: 4px;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}
