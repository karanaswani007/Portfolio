(function () {
    function textElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        element.textContent = text || "";
        return element;
    }

    function safeLink(value) {
        const link = String(value || "").trim();
        return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(link) ? link : "#";
    }

    function safeImage(value) {
        const image = String(value || "").trim();
        return /^(https?:\/\/|\/(?!\/))/i.test(image) ? image : "";
    }

    async function loadContent() {
        const response = await fetch("/api/content");
        if (!response.ok) throw new Error(`Unable to load portfolio content (${response.status}).`);
        return response.json();
    }

    function projectCard(project, includeCategory) {
        const wrapper = textElement("div", includeCategory ? `grid-item ${String(project.category || "").replace(/[^a-z0-9_-]/gi, "")}` : "");
        const card = textElement("div", "box tilt");
        const image = document.createElement("img");
        image.draggable = false;
        image.src = safeImage(project.image);
        image.alt = project.name || "Project";
        const content = textElement("div", "content");
        const tag = textElement("div", "tag");
        tag.append(textElement("h3", "", project.name));
        const description = textElement("div", "desc");
        description.append(textElement("p", "", project.desc));
        const buttons = textElement("div", "btns");

        [["view", "View", "fas fa-eye"], ["code", "Code", "fas fa-code"]].forEach(([key, label, icon]) => {
            const link = document.createElement("a");
            link.className = "btn";
            link.href = safeLink(project.links && project.links[key]);
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            if (key === "view") link.append(textElement("i", icon), document.createTextNode(` ${label}`));
            else link.append(document.createTextNode(`${label} `), textElement("i", icon));
            buttons.append(link);
        });

        description.append(buttons);
        content.append(tag, description);
        card.append(image, content);
        if (includeCategory) {
            wrapper.append(card);
            return wrapper;
        }
        return card;
    }

    function certificationCard(certification, includeCategory) {
        const category = String(certification.category || "").replace(/[^a-z0-9_-]/gi, "");
        const wrapper = textElement("div", includeCategory ? `grid-item ${category}` : "cert-card tilt");
        if (includeCategory) wrapper.classList.add("cert-grid-item");
        const card = includeCategory ? textElement("div", "cert-card tilt") : wrapper;
        const icon = textElement("div", certification.logo ? "cert-icon cert-icon--logo" : "cert-icon");
        if (certification.logo) {
            const image = document.createElement("img");
            image.className = "cert-logo";
            image.src = `/assets/images/organizations/${encodeURIComponent(certification.logo.toLowerCase())}.png`;
            image.alt = `${certification.organization || "Provider"} logo`;
            icon.append(image);
        } else {
            icon.append(textElement("i", "fas fa-certificate"));
        }

        card.append(icon, textElement("h3", "", certification.title), textElement("p", "", certification.description));
        const details = textElement("div", "cert-details");
        [["Provider", certification.organization], ["Issued", certification.issueDate], ["Credential", certification.credentialId]].forEach(([label, value]) => {
            const item = textElement("div", "cert-item");
            item.append(textElement("span", "", label), textElement("small", "", value));
            details.append(item);
        });
        const actions = textElement("div", "cert-actions");
        [["viewLink", "primary", "View Certificate"], ["proofLink", "secondary", "Proof Link"]].forEach(([field, className, label]) => {
            const link = textElement("a", className, label);
            link.href = safeLink(certification[field]);
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            actions.append(link);
        });
        card.append(details, actions);
        if (includeCategory) {
            wrapper.append(card);
            return wrapper;
        }
        return card;
    }

    window.PortfolioContent = {
        load: loadContent,
        safeLink: safeLink,
        safeImage: safeImage,
        projectCard: projectCard,
        certificationCard: certificationCard,
        textElement: textElement
    };
})();
