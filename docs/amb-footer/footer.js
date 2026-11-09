var e=new URL(``+new URL(`amb-grid-logo.png`,import.meta.url).href,``+import.meta.url).href,t=({href:t=`#top`}={})=>`
    <a class="demo-brand" href="${t}" aria-label="AMB Grid">
        <img class="demo-brand__logo" src="${e}" alt="AMB Grid">
    </a>
`,n=()=>{try{return globalThis.localStorage?.getItem(`amb-grid-demo-language`)===`en`?`en`:`it`}catch{return`it`}},r={it:{tagline:`Libreria CRUD framework-agnostic per applicazioni business.`,openSource:`Progetto open source.`,project:`Progetto`,source:`Codice sorgente`,issue:`Segnala un problema`,changelog:`Changelog`,license:`Licenza Apache 2.0`,author:`Autore`,description:`Sviluppatore e manutentore di AMB Grid.`,linkedin:`Profilo LinkedIn`,copyright:`Creato e mantenuto da Luigi Ambruoso`},en:{tagline:`Framework-agnostic CRUD grid library for business applications.`,openSource:`Open-source project.`,project:`Project`,source:`Source code`,issue:`Report an issue`,changelog:`Changelog`,license:`Apache 2.0 license`,author:`Author`,description:`Developer and maintainer of AMB Grid.`,linkedin:`LinkedIn profile`,copyright:`Created and maintained by Luigi Ambruoso`}},i=()=>{let e=r[n()],i=new Date().getFullYear();return`
    <footer class="demo-footer">
        <div class="demo-footer__inner">
            <div class="demo-footer__grid">
                <section class="demo-footer__brand" aria-label="AMB Grid">
                    ${t({href:`/#top`})}
                    <p data-footer-copy="tagline">${e.tagline}</p>
                    <p data-footer-copy="openSource">${e.openSource}</p>
                </section>
                <nav class="demo-footer__group" aria-label="${e.project}" data-footer-nav>
                    <h2 data-footer-copy="project">${e.project}</h2>
                    <a href="https://github.com/ambruoso-luigi/amb-grid" target="_blank" rel="noopener noreferrer" data-footer-copy="source">${e.source}</a>
                    <a href="https://github.com/ambruoso-luigi/amb-grid/issues" target="_blank" rel="noopener noreferrer" data-footer-copy="issue">${e.issue}</a>
                    <a href="https://github.com/ambruoso-luigi/amb-grid/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" data-footer-copy="changelog">${e.changelog}</a>
                    <a href="https://github.com/ambruoso-luigi/amb-grid/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" data-footer-copy="license">${e.license}</a>
                </nav>
                <section class="demo-footer__group">
                    <h2 data-footer-copy="author">${e.author}</h2>
                    <a class="demo-footer__author" href="https://www.linkedin.com/in/luigi-ambruoso/" target="_blank" rel="noopener noreferrer">Luigi Ambruoso</a>
                    <p data-footer-copy="description">${e.description}</p>
                    <a class="demo-footer__linkedin" href="https://www.linkedin.com/in/luigi-ambruoso/" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.447-2.136 2.941v5.665H9.351V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.555V9h3.564v11.452Z"/></svg><span data-footer-copy="linkedin">${e.linkedin}</span></a>
                </section>
            </div>
            <p class="demo-footer__copyright">© ${i} AMB Grid · <span data-footer-copy="copyright">${e.copyright}</span></p>
        </div>
    </footer>`},a=(e,t=n())=>{let i=r[t===`en`?`en`:`it`];e.querySelectorAll(`[data-footer-copy]`).forEach(e=>{e.textContent=i[e.dataset.footerCopy]}),e.querySelectorAll(`[data-footer-nav]`).forEach(e=>e.setAttribute(`aria-label`,i.project))},o=e=>{let t=t=>a(e,t.detail?.language);return window.addEventListener(`amb-demo-language-change`,t),()=>window.removeEventListener(`amb-demo-language-change`,t)};(e=>{if(!e)return()=>{};e.innerHTML=i();let t=o(e);return()=>{t(),e.replaceChildren()}})(document.querySelector(`.amb-docs-footer-host`));