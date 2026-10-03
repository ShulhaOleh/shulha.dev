type Tab = "about" | "projects";

const root = document.documentElement;
const tabLinks = document.querySelectorAll<HTMLAnchorElement>("[data-tab-link]");
const filterButtons = document.querySelectorAll<HTMLButtonElement>("[data-filter-button]");

function currentTab(): Tab {
    return location.hash === "#projects" ? "projects" : "about";
}

function showTab(tab: Tab): void {
    root.dataset.tab = tab;
    for (const link of tabLinks) {
        if (link.dataset.tabLink === tab) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
    }
}

function setFilter(filter: string): void {
    root.dataset.filter = filter;
    for (const button of filterButtons) {
        button.setAttribute("aria-pressed", String(button.dataset.filterButton === filter));
    }
}

window.addEventListener("hashchange", () => showTab(currentTab()));

for (const button of filterButtons) {
    button.addEventListener("click", () => setFilter(button.dataset.filterButton ?? "all"));
}

showTab(currentTab());
