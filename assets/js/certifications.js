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

function showCertifications(certifications) {
    const container = document.querySelector('.work .cert-container');
    if (!container) return;

    container.replaceChildren(...certifications.map(cert => PortfolioContent.certificationCard(cert, true)));
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

PortfolioContent.load()
    .then(content => showCertifications(content.certifications || []))
    .catch(error => {
        console.error("Unable to load certifications:", error);
        const container = document.querySelector('.work .cert-container');
        if (container) container.textContent = "Certifications could not be loaded. Please try again later.";
    });