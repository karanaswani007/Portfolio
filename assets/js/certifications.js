$(document).ready(function () {
    $('#menu').click(function () {
        $(this).toggleClass('fa-times');
        $('.navbar').toggleClass('nav-toggle');
    });

    $(window).on('scroll load', function () {
        $('#menu').removeClass('fa-times');
        $('.navbar').removeClass('nav-toggle');

        if (window.scrollY > 60) {
            document.querySelector('#scroll-top').classList.add('active');
        } else {
            document.querySelector('#scroll-top').classList.remove('active');
        }
    });
});

document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === "visible") {
        document.title = "Certifications | Portfolio Karan Aswani";
        $("#favicon").attr("href", "./assets/images/favicon.png");
    } else {
        document.title = "Come Back To Portfolio";
        $("#favicon").attr("href", "./assets/images/favhand.png");
    }
});

function getCertifications() {
    return fetch("./assets/data/certifications.json")
        .then(response => response.json())
        .then(data => data)
        .catch(error => {
            console.error("Unable to load certifications", error);
            return [];
        });
}

function showCertifications(certifications) {
    const container = document.querySelector('.work .cert-container');
    if (!container) return;

    const html = certifications.map(cert => {
        const hasLogo = Boolean(cert.logo);
        const logoHtml = hasLogo ? `<img class="cert-logo" src="./assets/images/organizations/${cert.logo}.png" alt="${cert.organization} logo" />` : `<i class="fas fa-certificate"></i>`;
        const iconClass = hasLogo ? 'cert-icon cert-icon--logo' : 'cert-icon';
                return `
                <div class="grid-item ${cert.category}">
                    <div class="cert-card tilt">
                        <div class="${iconClass}">${logoHtml}</div>
                        <h3>${cert.title}</h3>
                        <p>${cert.description}</p>
                        <div class="cert-details">
                            <div class="cert-item"><span>Provider</span><small>${cert.organization}</small></div>
                            <div class="cert-item"><span>Issued</span><small>${cert.issueDate}</small></div>
                            <div class="cert-item"><span>Credential</span><small>${cert.credentialId}</small></div>
                        </div>
                        <div class="cert-actions">
                            <a class="primary" href="${cert.viewLink}" target="_blank"><i class="fas fa-eye"></i> View Certificate</a>
                            <a class="secondary" href="${cert.proofLink}" target="_blank">Proof Link</a>
                        </div>
                    </div>
                </div>
        `;
    }).join('');

    container.innerHTML = html;
    VanillaTilt.init(document.querySelectorAll('.tilt'), { max: 15 });

    // Simple CSS-driven filtering (keeps CSS Grid layout intact)
    $('.button-group').on('click', 'button', function () {
        $('.button-group').find('.is-checked').removeClass('is-checked');
        $(this).addClass('is-checked');
        var filterValue = $(this).attr('data-filter');
        if (filterValue === '*') {
            $('.box-container .grid-item').show();
        } else {
            $('.box-container .grid-item').each(function () {
                var $item = $(this);
                if ($item.is(filterValue)) $item.show(); else $item.hide();
            });
        }
    });
}

getCertifications().then(data => showCertifications(data));