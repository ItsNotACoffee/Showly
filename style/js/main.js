var emailValidString = new RegExp('^[^@]+@[^@]+\.[^@]+$');

const hamburger = document.querySelector('.hamburger');
const hamburger_top = document.querySelector('.hamburger .top');
const hamburger_bottom = document.querySelector('.hamburger .bottom');
const searchbar = document.querySelector('.searchbar');
const searchform = document.querySelector('.search-form');

const loginForm = document.getElementsByName('loginForm')[0];
const email = document.getElementsByName('email')[0];
const password = document.getElementsByName('password')[0];

const registerForm = document.getElementsByName('registerForm')[0];
const repeatPassword = document.getElementsByName('repeatPassword')[0];

const seasons = document.getElementsByName('seasons')[0];

const deleteBtn = document.getElementsByName('trigger-del')[0];

//sidebar
if (hamburger !== null) {
    let menuOpen = false;
    hamburger.addEventListener('click', () => {
        if (!menuOpen) {
            hamburger_top.classList.add('hamburger-open-top');
            hamburger_bottom.classList.add('hamburger-open-bottom');
            hamburger_top.classList.remove('top');
            hamburger_bottom.classList.remove('bottom');

            document.querySelector('.sidebar').classList.remove('sidebar-widthfix-closed');
            document.querySelector('.sidebar').classList.add('sidebar-widthfix-open');
            document.querySelector('.slide-handler').classList.remove('slide-handler-closed');
            document.querySelector('.slide-handler').classList.add('slide-handler-open');

            /* set icons and labels */
            document.querySelector('.wrapper .sidebar #l1').classList.remove('sidebar-listfix-closed');
            document.querySelector('.wrapper .sidebar #l2').classList.remove('sidebar-listfix-closed');
            document.querySelector('.wrapper .sidebar #l3').classList.remove('sidebar-listfix-closed');
            document.querySelector('.wrapper .sidebar #l4').classList.remove('sidebar-listfix-closed');
            document.querySelector('.wrapper .sidebar #l1').classList.add('sidebar-listfix-open');
            document.querySelector('.wrapper .sidebar #l2').classList.add('sidebar-listfix-open');
            document.querySelector('.wrapper .sidebar #l3').classList.add('sidebar-listfix-open');
            document.querySelector('.wrapper .sidebar #l4').classList.add('sidebar-listfix-open');
            document.querySelector('.wrapper .sidebar #ttl1').classList.remove('hide');
            document.querySelector('.wrapper .sidebar #ttl2').classList.remove('hide');
            document.querySelector('.wrapper .sidebar #ttl3').classList.remove('hide');
            document.querySelector('.wrapper .sidebar #ttl4').classList.remove('hide');
            document.querySelector('.wrapper .sidebar #ttl1').classList.add('show');
            document.querySelector('.wrapper .sidebar #ttl2').classList.add('show');
            document.querySelector('.wrapper .sidebar #ttl3').classList.add('show');
            document.querySelector('.wrapper .sidebar #ttl4').classList.add('show');

            //document.querySelector('.wrapper .sidebar #pfpurlside').classList.remove('hide');
            //document.querySelector('.wrapper .sidebar #pfpurlside').classList.add('show');

            /* set legal info visibility */
            document.getElementById('legal').classList.remove('hide');
            document.getElementById('legal').classList.add('show');

            menuOpen = true;
        } else {
            hamburger_top.classList.remove('hamburger-open-top');
            hamburger_bottom.classList.remove('hamburger-open-bottom');
            hamburger_top.classList.add('top');
            hamburger_bottom.classList.add('bottom');

            document.querySelector('.sidebar').classList.remove('sidebar-widthfix-open');
            document.querySelector('.sidebar').classList.add('sidebar-widthfix-closed');
            document.querySelector('.slide-handler').classList.remove('slide-handler-open');
            document.querySelector('.slide-handler').classList.add('slide-handler-closed');

            /* set icons and labels */
            document.querySelector('.wrapper .sidebar #l1').classList.remove('sidebar-listfix-open');
            document.querySelector('.wrapper .sidebar #l2').classList.remove('sidebar-listfix-open');
            document.querySelector('.wrapper .sidebar #l3').classList.remove('sidebar-listfix-open');
            document.querySelector('.wrapper .sidebar #l4').classList.remove('sidebar-listfix-open');
            document.querySelector('.wrapper .sidebar #l1').classList.add('sidebar-listfix-closed');
            document.querySelector('.wrapper .sidebar #l2').classList.add('sidebar-listfix-closed');
            document.querySelector('.wrapper .sidebar #l3').classList.add('sidebar-listfix-closed');
            document.querySelector('.wrapper .sidebar #l4').classList.add('sidebar-listfix-closed');
            document.querySelector('.wrapper .sidebar #ttl1').classList.remove('show');
            document.querySelector('.wrapper .sidebar #ttl2').classList.remove('show');
            document.querySelector('.wrapper .sidebar #ttl3').classList.remove('show');
            document.querySelector('.wrapper .sidebar #ttl4').classList.remove('show');
            document.querySelector('.wrapper .sidebar #ttl1').classList.add('hide');
            document.querySelector('.wrapper .sidebar #ttl2').classList.add('hide');
            document.querySelector('.wrapper .sidebar #ttl3').classList.add('hide');
            document.querySelector('.wrapper .sidebar #ttl4').classList.add('hide');

            //document.querySelector('.wrapper .sidebar #pfpurlside').classList.remove('show');
            //document.querySelector('.wrapper .sidebar #pfpurlside').classList.add('hide');

            /* set legal info visibility */
            document.getElementById('legal').classList.remove('show');
            document.getElementById('legal').classList.add('hide');

            menuOpen = false;
        }
    });
}

//searchbar
searchbar.addEventListener('focus', () => {
    searchbar.placeholder = 'Search for movies or tv shows...';
});

searchbar.addEventListener('blur', () => {
    searchbar.placeholder = 'Search...';
});

searchform.addEventListener('submit', (e) => {
    if (searchbar.value == null || searchbar.value == '') {
        e.preventDefault();
    }
});

//login form
if (loginForm != null) {
    loginForm.addEventListener('submit', (e) => {
        if (email.value == null || email.value == '' ||
            password.value == null || password.value == '') {
            e.preventDefault();
        }
    });
}

//register form
if (registerForm != null) {
    registerForm.addEventListener('submit', (e) => {
        if (password.value == null || password.value == '' ||
            repeatPassword.value == null || repeatPassword.value == '') {
            e.preventDefault();
        }
        if (!emailValidString.test(String(email.value).toLowerCase())) {
            e.preventDefault();
        }
    });
}

//details episode list
if (seasons != null) {
    seasons.addEventListener('change', () => {
        var nodes = document.getElementById('episodes').childNodes,
            season = 's' + String(seasons.value),
            added = 'addeds' + String(seasons.value);

        document.getElementsByName('selectedseason')[0].value = seasons.value;
        if (seasons.value == 0) { //add button
            if (document.getElementsByName('loggedIn')[0].value == 1) {
                document.getElementById('addseasontowatchlist').classList.add('hidden');
                document.getElementById('editSeason').classList.add('hidden');
            }
            document.querySelector('.episodes').classList.add('hidden');
        } else {
            if (document.getElementsByName('loggedIn')[0].value == 1) {
                document.getElementById('addseasontowatchlist').classList.remove('hidden');
            }
            document.querySelector('.episodes').classList.remove('hidden');
        }

        for (var i = 0; i < nodes.length; i++) { //episodes
            if (nodes[i].nodeName.toLowerCase() == 'div') {
                if (nodes[i].getAttribute("name").toLowerCase() == added) {
                    //tools
                    let imdbid = document.getElementsByName('imdbid')[0].value;
                    document.getElementById('editSeason').classList.remove('hidden');
                    document.getElementById('editSeason').href = '/watchlist/edit/' + imdbid + '?s=' + seasons.value;
                    document.getElementById('addseasontowatchlist').disabled = true;
                    document.getElementById('addseasontowatchlist').classList.add('btn-misc-dsbl');
                    document.getElementById('addseasontowatchlist').classList.remove('btn-misc');
                    document.getElementById('addseasontowatchlist').innerHTML = '✔ ADDED';
                    //
                    nodes[i].classList.remove('hidden');
                } else if (nodes[i].getAttribute("name").toLowerCase() == season) {
                    //tools
                    document.getElementById('editSeason').classList.add('hidden');
                    document.getElementById('editSeason').href = '';
                    document.getElementById('addseasontowatchlist').disabled = false;
                    document.getElementById('addseasontowatchlist').classList.add('btn-misc');
                    document.getElementById('addseasontowatchlist').classList.remove('btn-misc-dsbl');
                    document.getElementById('addseasontowatchlist').innerHTML = 'ADD S' + seasons.value + ' TO WATCHLIST';
                    //
                    nodes[i].classList.remove('hidden');
                } else if (nodes[i].getAttribute("name").toLowerCase() == 'theader' && seasons.value != 0) {
                    //do nothing - no need to hide theader
                } else {
                    nodes[i].classList.add('hidden');
                }
            }
        }
    });
}

//watchlist seasons list
document.addEventListener('click', (e) => { //on click event to every el in document
    if (e.target && e.target.id.toString().includes('ws')) {
        var divNodes = e.target.parentNode.childNodes;

        //set arrow
        for (let node of divNodes) {
            if (node.nodeName.toLowerCase() == 'i') {
                if (node.classList.contains('arrow-right')) {
                    node.classList.remove('arrow-right');
                    node.classList.add('arrow-down');
                } else if (node.classList.contains('arrow-down')) {
                    node.classList.remove('arrow-down');
                    node.classList.add('arrow-right');
                }
            }
        }

        var lstId = e.target.id + '_lst';
        const targetLst = document.getElementById(lstId);

        if (targetLst.classList.contains('hidden-list')) {
            //remove hidden before calculating to add items
            targetLst.classList.remove('hidden');

            //calculate the max height based on content height only the first time
            if (targetLst.style.maxHeight == null) {
                var scrollHeight = targetLst.scrollHeight,
                    transition = targetLst.style.transition;
                targetLst.style.transition = '';

                targetLst.style.maxHeight = scrollHeight + "px";
                targetLst.style.transition = transition;
            }

            setTimeout(function () {
                targetLst.classList.remove('hidden-list');
            }, 10);
        } else {

            targetLst.classList.add('hidden-list');
            setTimeout(function () {
                targetLst.classList.add('hidden');
            }, 300);
        }
    }
});

function setChartData() {
    var completed = document.getElementById('chart-line-completed').getAttribute('data-percentage'),
        watching = document.getElementById('chart-line-watching').getAttribute('data-percentage'),
        plantowatch = document.getElementById('chart-line-plantowatch').getAttribute('data-percentage'),
        dropped = document.getElementById('chart-line-dropped').getAttribute('data-percentage'),
        total = document.getElementById('chart').getAttribute('data-total');

        //calc percentages
        completed = completed != 0 ? ((completed/total)*100) : 0;
        watching = watching != 0 ? ((watching/total)*100) : 0;
        plantowatch = plantowatch != 0 ? ((plantowatch/total)*100) : 0;
        dropped = dropped != 0 ? ((dropped/total)*100) : 0;

        //set inline styles
        document.getElementById('chart-line-completed').style.width = completed + '%';
        document.getElementById('chart-line-watching').style.width = watching + '%';
        document.getElementById('chart-line-plantowatch').style.width = plantowatch + '%';
        document.getElementById('chart-line-dropped').style.width = dropped + '%';
};