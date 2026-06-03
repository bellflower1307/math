window.onload = function () {
  const toc = document.getElementById("toc-list");
  if (!toc) return;

  const headers = document.querySelectorAll("h2, h3");

  headers.forEach((header, index) => {
    const id = "section-" + index;
    header.id = id;

    const li = document.createElement("li");
    li.style.marginLeft = header.tagName === "H3" ? "1rem" : "0";

    const a = document.createElement("a");
    a.href = "#" + id;
    a.textContent = header.textContent;

    li.appendChild(a);
    toc.appendChild(li);
  });
};
