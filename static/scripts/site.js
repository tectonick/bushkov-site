document.getElementById("en").onclick = () => {
  document.cookie = "locale=en; expires=Thu, 18 Dec 2999 12:00:00 UTC; path=/";
};
document.getElementById("ru").onclick = () => {
  document.cookie = "locale=ru; expires=Thu, 18 Dec 2999 12:00:00 UTC; path=/";
};


var ReadyEvent = new Event("Ready", {
  bubbles: true,
  cancelable: true,
});
const activeClass = "active";
barba.init({
  debug: true,
  logLevel: "debug",
  transitions: [
    {
      name: "opacity-transition",
      once(data) {
        $(`.menu-item > a[href$="${data.next.url.path}"]`)
          .closest(".menu-item")
          .each(function () {
            $(this).addClass(activeClass);
          });
        InitHook();
      },
      leave(data) {
        return gsap.to(data.current.container, {
          opacity: 0,
        });
      },
      afterLeave(data) {
        return new Promise(function (resolve) {
          data.current.container.style.display = "none";
          resolve();
        });
      },
      enter(data) {
        InitHook();
        window.scrollTo(0, 0);
        return gsap.from(data.next.container, {
          opacity: 0,
        });
      },
    },
  ],
});

barba.hooks.afterLeave((data) => {
  // Update the active menu item classes
  console.log("afterLeave");
  if (data.next.url.path) {
    $(".menu-item." + activeClass).each(function () {
      $(this).removeClass(activeClass);
    });
    $(`.menu-item > a[href$="${data.next.url.path}"]`)
      .closest(".menu-item")
      .each(function () {
        $(this).addClass(activeClass);
      });
  }
});




function clearBlog() {
  let blog = document.getElementById("blog");
  blog.querySelectorAll("div").forEach((element) => {
    element.remove();
  });
  loadPosts.loadedCount = 0;
  loadPosts(blog, createPost, 4, 0);
}

function createPost(post) {
  let postDiv = document.createElement("div");
  postDiv.classList.add("post");
  let postDate = document.createElement("em");
  postDate.classList.add("date");
  postDate.innerText = post.date;
  let postTitle = document.createElement("h3");
  postTitle.innerText = post.title;
  let postText = document.createElement("div");
  postText.classList.add("post-text");
  postText.innerHTML = post.text;
  let postTags = document.createElement("div");
  postTags.classList.add("tags");
  post.tags.forEach((tag) => {
    let postTag = document.createElement("a");
    postTag.href = `/blog#${tag}`;
    postTag.innerText = `#${tag}`;
    postTag.addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = tag;
      clearBlog();
    });
    postTags.append(postTag);
  });
  postDiv.append(postTitle);
  postDiv.append(postDate);
  postDiv.append(postText);
  postDiv.append(postTags);
  return postDiv;
}

function createPostForm(post) {
  let postDiv = document.createElement("div");
  postDiv.classList.add("post");
  postDiv.setAttribute("name", post.id);
  let postForm = document.createElement("form");

  let postId = document.createElement("input");
  postId.type = "hidden";
  postId.name = "id";
  postId.value = post.id;

  let postMetaDiv = document.createElement("div");
  postMetaDiv.classList.add("post-meta");

  let postDate = document.createElement("input");
  postDate.type = "datetime-local";
  postDate.classList.add("date");
  postDate.innerText = post.date;
  postDate.value = post.date.replace(" ", "T");
  postDate.name = "date";

  let postSavedLabel = document.createElement("p");
  postSavedLabel.classList.add("status");
  postSavedLabel.innerText = "Не изменено";
  postSavedLabel.style.backgroundColor = "gray";
  postSavedLabel.style.paddingLeft = "10px";

  let postTitle = document.createElement("input");
  postTitle.type = "text";
  postTitle.name = "title";
  postTitle.innerText = post.title;
  postTitle.value = post.title;
  postTitle.placeholder = "Название поста";

  let postText = document.createElement("textarea");
  postText.classList.add("editor");
  postText.innerText = post.text;
  postText.name = "text";
  postText.rows = 5;

  let postTags = document.createElement("input");
  postTags.type = "text";
  postTags.name = "tags";
  postTags.innerText = post.tags.join(", ");
  postTags.value = postTags.innerText;
  postTags.placeholder = "Теги";
  postTags.classList.add("tags");

  let postSaveButton = document.createElement("input");
  postSaveButton.classList.add("form-control");
  postSaveButton.type = "submit";
  postSaveButton.value = "Сохранить";
  postSaveButton.name = "save";
  postSaveButton.addEventListener("click", (e) => {
    e.preventDefault();
    tinyMCE.triggerSave();
    let data = new FormData(postForm);
    fetch("/api/blog/save", { method: "POST", body: data })
      .then(() => {
        postSavedLabel.innerText = "Cохранено";
        postSavedLabel.style.backgroundColor = "green";
      })
      .catch(() => {
        postSavedLabel.innerText = "Ошибка сохранения";
        postSavedLabel.style.backgroundColor = "red";
      });
  });

  let postDeleteButton = document.createElement("input");
  postDeleteButton.classList.add("form-control");
  postDeleteButton.type = "submit";
  postDeleteButton.value = "Удалить";
  postDeleteButton.name = "delete";
  postDeleteButton.addEventListener("click", (e) => {
    e.preventDefault();
    var modal = $("#deleteModal");
    modal.attr("name", post.id);
    modal.modal();
  });

  postForm.addEventListener("input", (e) => {
    postSavedLabel.style.backgroundColor = "orange";
    postSavedLabel.innerText = "Не сохранено";
  });
  postText.addEventListener("update", (e) => {
    postSavedLabel.style.backgroundColor = "orange";
    postSavedLabel.innerText = "Не сохранено";
  });

  let postButtons = document.createElement("div");
  postButtons.classList.add("post-buttons");
  postButtons.append(postDeleteButton);
  postButtons.append(postSaveButton);

  postForm.append(postId);
  postForm.append(postMetaDiv);

  postMetaDiv.append(postTitle);
  postMetaDiv.append(postTags);
  postMetaDiv.append(postDate);

  postForm.append(postText);

  postForm.append(postButtons);
  postForm.append(postSavedLabel);

  postDiv.append(postForm);

  return postDiv;
}

function initTiny() {
  tinymce.init({
    selector: "textarea.editor",
    plugins:
      "paste importcss searchreplace autolink save visualblocks visualchars image link media template table charmap hr pagebreak nonbreaking toc insertdatetime advlist lists imagetools textpattern noneditable charmap quickbars emoticons",
    imagetools_cors_hosts: ["picsum.photos"],
    menubar: "edit view insert format tools table",
    toolbar:
      "undo redo | bold italic underline strikethrough | image media link | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | charmap emoticons ",
    toolbar_sticky: true,
    image_advtab: true,
    link_list: [
      { title: "My page 1", value: "http://www.tinymce.com" },
      { title: "My page 2", value: "http://www.moxiecode.com" },
    ],
    image_list: [
      { title: "My page 1", value: "http://www.tinymce.com" },
      { title: "My page 2", value: "http://www.moxiecode.com" },
    ],
    image_class_list: [
      { title: "None", value: "" },
      { title: "Some class", value: "class-name" },
    ],
    importcss_append: true,
    file_picker_callback: function (callback, value, meta) {
      /* Provide file and text for the link dialog */
      if (meta.filetype === "file") {
        callback("https://www.google.com/logos/google.jpg", {
          text: "My text",
        });
      }
      /* Provide image and alt text for the image dialog */
      if (meta.filetype === "image") {
        callback("https://www.google.com/logos/google.jpg", {
          alt: "My alt text",
        });
      }
      /* Provide alternative source and posted for the media dialog */
      if (meta.filetype === "media") {
        callback("movie.mp4", {
          source2: "alt.ogg",
          poster: "https://www.google.com/logos/google.jpg",
        });
      }
    },
    setup: function (ed) {
      ed.on("keyup", function (e) {
        ed.targetElm.dispatchEvent(new Event("update"));
      });
      ed.on("change", function (e) {
        ed.targetElm.dispatchEvent(new Event("update"));
      });
    },
    templates: [
      {
        title: "New Table",
        description: "creates a new table",
        content:
          '<div class="mceTmpl"><table width="98%%"  border="0" cellspacing="0" cellpadding="0"><tr><th scope="col"> </th><th scope="col"> </th></tr><tr><td> </td><td> </td></tr></table></div>',
      },
      {
        title: "Starting my story",
        description: "A cure for writers block",
        content: "Once upon a time...",
      },
      {
        title: "New list with dates",
        description: "New List with dates",
        content:
          '<div class="mceTmpl"><span class="cdate">cdate</span><br /><span class="mdate">mdate</span><h2>My List</h2><ul><li></li><li></li></ul></div>',
      },
    ],
    template_cdate_format: "[Date Created (CDATE): %m/%d/%Y : %H:%M:%S]",
    template_mdate_format: "[Date Modified (MDATE): %m/%d/%Y : %H:%M:%S]",
    height: 600,
    image_caption: true,
    quickbars_selection_toolbar:
      "bold italic | quicklink h2 h3 blockquote quickimage quicktable",
    noneditable_noneditable_class: "mceNonEditable",
    toolbar_mode: "sliding",
    contextmenu: "link image imagetools table",
    content_style:
      " body { font-family:Helvetica,Arial,sans-serif; font-size:14px; }",
  });
}

function loadPosts(
  where,
  postConstructor,
  count,
  from = loadPosts.loadedCount
) {
  if (loadPosts.loadedCount === undefined) {
    loadPosts.loadedCount = 0;
  }
  let tag = location.hash.replace("#", "");
  return fetch(
    `/api/blog/posts?from=${from}&count=${count}&tag=${tag}`
  )
    .then((response) => response.json())
    .then((posts) => {
      Array.from(posts).forEach((post) => {
        let postDiv = postConstructor(post);
        where.append(postDiv);
      });
      loadPosts.loadedCount += posts.length;
    });
}

function InitHook() {
  let video = document.getElementById("video1");
  let player = document.getElementById("YourPlayerID");
  let blog = document.getElementById("blog");
  let adminBlog = document.getElementById("admin-blog");

  if (blog) {
    loadPosts(blog, createPost, 4, 0);
    let nextPostsButton = document.getElementById("next-posts");
    nextPostsButton.addEventListener("click", (e) => {
      e.preventDefault();
      loadPosts(blog, createPost, 4);
    });
    document
      .getElementById("show-all-button")
      .addEventListener("click", (e) => {
        e.preventDefault();
        location.hash = "";
        clearBlog();
      });
  }

  if (adminBlog) {
    $("#modal-delete").click(function () {
      let modal = $("#deleteModal");
      let idToDelete = modal.attr("name");
      let bodyData = new FormData();
      bodyData.append("id", idToDelete);
      fetch("/api/blog/delete", { method: "POST", body: bodyData });
      document.querySelector(`div[name="${idToDelete}"]`).remove();
      modal.modal("hide");
    });

    loadPosts(adminBlog, createPostForm, 4, 0).then(() => {
      initTiny();
    });
    let nextPostsButton = document.getElementById("next-posts");
    nextPostsButton.addEventListener("click", (e) => {
      e.preventDefault();
      loadPosts(adminBlog, createPostForm, 4).then(() => {
        initTiny();
      });
    });
    let addPostButton = document.getElementById("post-add");
    addPostButton.addEventListener("click", (e) => {
      e.preventDefault();
      fetch("/api/blog/add", { method: "POST", body: { id: 0 } }).then(() => {
        window.location.reload();
      });
    });
  }

  if (player) {
    window.document.dispatchEvent(ReadyEvent);
  }
  window.scrollTo(0, 0);
  $(".delete-img-button").click(function () {
    $(this).parent().parent().css("display", "none");
    $.post("/admin/gallery/delete", { filename: $(this).attr("id") });
  });
  $("#files").change(function () {
    if ($(this).val().length > 0) {
      $(this).siblings(".form-control").prop("disabled", false);
    }
  });
  if (video) {
    video.play();
  }
  if (document.getElementById("YourPlayerID")) {
    var controller = new YTV("YourPlayerID", {
      playlist: "PLyI9VmhxB4FwTBwiLgyRK0eNTe5tKEQoI",
      responsive: true,
      accent: "#fff",
      browsePlaylists: true,
      seeMore: "Youtube",
    });
  }
  if (document.querySelector(".tz-gallery")) {
    baguetteBox.run(".tz-gallery");
  }

  $(".delete-button").click(function () {
    var modal = $("#deleteModal");
    modal.attr("name", $(this).attr("name"));
    modal.modal();
  });

  $(".fileToUpload").change(function () {
    if ($(this).val().length > 0) {
      $(this).siblings(".form-control").prop("disabled", false);
    }
  });

  $(".save-button").click(function (ev) {
    var target = ev.target;
    target.setAttribute("disabled", "disabled");
    var formName = $(this).attr("name");
    var formData = $("#" + formName).serialize();
    $.post("/admin/concerts/edit", formData, (data, status) => {
      target.removeAttribute("disabled");
      var oldColor = $(this).css("backgroundColor");
      $(this).animate({ backgroundColor: "#32CD32" }, 1000, function () {
        $(this).animate({ backgroundColor: oldColor });
      });
    }).fail(() => {
      target.removeAttribute("disabled");
      var oldColor = $(this).css("backgroundColor");
      $(this).animate({ backgroundColor: "#8B0000" }, 1000, function () {
        $(this).animate({ backgroundColor: oldColor });
      });
    });
  });
}

