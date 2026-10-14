function renderEducation(items) {
    const container = document.querySelector(".education .box-container");
    if (!container) return;
    container.replaceChildren();
    items.forEach(item => {
        const card = PortfolioContent.textElement("div", "box");
        const imageWrap = PortfolioContent.textElement("div", "image");
        const image = document.createElement("img");
        image.draggable = false;
        image.src = PortfolioContent.safeImage(item.image);
        image.alt = item.institution || "Education";
        const content = PortfolioContent.textElement("div", "content");
        content.append(
            PortfolioContent.textElement("h3", "", item.degree),
            PortfolioContent.textElement("p", "", item.institution),
            PortfolioContent.textElement("h4", "", item.period)
        );
        imageWrap.append(image);
        card.append(imageWrap, content);
        container.append(card);
    });
}

function renderExperience(items, container) {
    if (!container) return;
    container.replaceChildren();
    items.forEach((item, index) => {
        const entry = PortfolioContent.textElement("div", `container ${index % 2 === 0 ? "right" : "left"}`);
        const content = PortfolioContent.textElement("div", "content");
        const tag = PortfolioContent.textElement("div", "tag");
        tag.append(PortfolioContent.textElement("h2", "", item.company));
        const description = PortfolioContent.textElement("div", "desc");
        description.append(
            PortfolioContent.textElement("h3", "", item.role),
            PortfolioContent.textElement("p", "", item.period)
        );
        content.append(tag, description);
        entry.append(content);
        container.append(entry);
    });
}

function renderSocials(socials) {
    const homeSocials = document.querySelector(".social-icons");
    const footerSocials = document.querySelector(".footer .share");
    [homeSocials, footerSocials].forEach(container => {
        if (!container) return;
        container.replaceChildren();
        socials.forEach(social => {
            const link = document.createElement("a");
            link.href = PortfolioContent.safeLink(social.url);
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.setAttribute("aria-label", social.name || "Social link");
            const icon = document.createElement("i");
            icon.className = String(social.icon || "").replace(/[^a-z0-9 -]/gi, "");
            link.append(icon);
            if (container.tagName === "UL") {
                const item = document.createElement("li");
                item.append(link);
                container.append(item);
            } else {
                container.append(link);
            }
        });
    });
}

function updatePortfolio(content) {
    const hero = content.hero || {};
    const heading = document.querySelector(".home .content h2");
    if (heading) {
        heading.replaceChildren(
            document.createTextNode(`${hero.greeting || ""} `),
            document.createElement("br"),
            document.createTextNode(` I'm ${hero.firstName || ""} `),
            PortfolioContent.textElement("span", "", hero.lastName)
        );
    }
    const heroImage = document.querySelector(".home .image img");
    if (heroImage && hero.image) heroImage.src = PortfolioContent.safeImage(hero.image);

    const about = content.about || {};
    const aboutSection = document.querySelector(".about");
    if (aboutSection) {
        const aboutImage = aboutSection.querySelector(".row > .image img");
        if (aboutImage && about.image) aboutImage.src = PortfolioContent.safeImage(about.image);
        const aboutCopy = aboutSection.querySelector(".row > .content");
        if (aboutCopy) {
            aboutCopy.querySelector("h3").textContent = `I'm ${about.name || ""}`;
            aboutCopy.querySelector(".tag").textContent = about.tag || "";
            aboutCopy.querySelector(":scope > p").textContent = about.description || "";
            const details = aboutCopy.querySelector(".box-container .box");
            if (details) {
                details.replaceChildren();
                const email = PortfolioContent.textElement("p");
                email.append(PortfolioContent.textElement("span", "", " email : "), document.createTextNode(` ${about.email || ""}`));
                const location = PortfolioContent.textElement("p");
                location.append(PortfolioContent.textElement("span", "", " place : "), document.createTextNode(` ${about.location || ""}`));
                details.append(email, location);
            }
            const resume = aboutCopy.querySelector(".resumebtn a");
            if (resume) resume.href = PortfolioContent.safeLink(about.resume);
        }
    }

    renderEducation(content.education || []);
    const experienceItems = document.querySelector(".experience .quote")
        ? (content.experience || [])
        : (content.experience || []).slice(0, 6);
    renderExperience(experienceItems, document.querySelector(".experience .timeline"));
    renderSocials(content.socials || []);

    const footer = document.querySelector(".footer");
    const contact = content.contact || {};
    if (footer) {
        const boxes = footer.querySelectorAll(".box-container .box");
        if (boxes[0]) {
            boxes[0].querySelector("h3").textContent = contact.footerTitle || "";
            boxes[0].querySelector("p").textContent = contact.footerMessage || "";
        }
        if (boxes[2]) {
            const paragraphs = boxes[2].querySelectorAll("p");
            if (paragraphs[0]) paragraphs[0].lastChild.textContent = contact.phone || "";
            if (paragraphs[1]) paragraphs[1].lastChild.textContent = contact.email || "";
            if (paragraphs[2]) paragraphs[2].lastChild.textContent = contact.location || "";
        }
        const credit = footer.querySelector(".credit a");
        if (credit) {
            credit.textContent = ` ${contact.creditName || ""}`;
            credit.href = PortfolioContent.safeLink(contact.creditUrl);
        }
    }

    const skills = document.getElementById("skillsContainer");
    if (skills) {
        skills.replaceChildren();
        (content.skills || []).forEach(skill => {
            const bar = PortfolioContent.textElement("div", "bar");
            const info = PortfolioContent.textElement("div", "info");
            const image = document.createElement("img");
            image.src = PortfolioContent.safeImage(skill.icon);
            image.alt = skill.name || "Skill";
            info.append(image, PortfolioContent.textElement("span", "", skill.name));
            bar.append(info);
            skills.append(bar);
        });
    }

    const projects = document.querySelector("#work .box-container");
    if (projects) {
        projects.replaceChildren(...(content.projects || []).slice(0, 10).filter(project => project.category !== "android").map(project => PortfolioContent.projectCard(project, false)));
        if (window.VanillaTilt) VanillaTilt.init(projects.querySelectorAll(".tilt"), { max: 15 });
    }

    const certifications = document.getElementById("certificationsContainer");
    if (certifications) {
        certifications.replaceChildren(...(content.certifications || []).slice(0, 6).map(certification => PortfolioContent.certificationCard(certification, false)));
        if (window.VanillaTilt) VanillaTilt.init(certifications.querySelectorAll(".tilt"), { max: 15 });
    }

    if (window.Typed && hero.roles?.length) {
        if (window.portfolioTyped) window.portfolioTyped.destroy();
        window.portfolioTyped = new Typed(".typing-text", {
            strings: hero.roles,
            loop: true,
            typeSpeed: 50,
            backSpeed: 25,
            backDelay: 500
        });
    }
}

PortfolioContent.load()
    .then(updatePortfolio)
    .catch(error => console.error("Failed to load portfolio content:", error));
