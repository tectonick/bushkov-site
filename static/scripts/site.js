document.getElementById("en").onclick = () => {
  document.cookie = "locale=en; expires=Thu, 18 Dec 2999 12:00:00 UTC; path=/";
};
document.getElementById("ru").onclick = () => {
  document.cookie = "locale=ru; expires=Thu, 18 Dec 2999 12:00:00 UTC; path=/";
};

var ReadyEvent=new Event("Ready", {
  bubbles: true,
  cancelable: true
});
const activeClass = 'active';  
barba.init({
  debug: true,
   logLevel: 'debug',
  transitions: [
    {
      name: "opacity-transition",
      once(data) {
    
          $(`.menu-item > a[href$="${ data.next.url.path }"]`).closest('.menu-item').each( function() {
            $(this).addClass(activeClass);
          });
          InitHook();   
      },
      leave(data) {
        return gsap.to(data.current.container, {
          opacity: 0,
        });
      },
      afterLeave(data){
        return new Promise(function(resolve){
            data.current.container.style.display='none';
            resolve();
        })
      },
      enter(data) {
        InitHook();       
        window.scrollTo(0,0);
        return gsap.from(data.next.container, {
          opacity: 0,
        });
        
      },
    },
  ],
});


function createPost(post){
  let postDiv=document.createElement('div');
      postDiv.classList.add('post');
      let postDate=document.createElement('em');
      postDate.classList.add('date');
      postDate.innerText=post.date;
      let postTitle=document.createElement('h3');
      postTitle.innerText=post.title;
      let postText=document.createElement('div');
      postText.classList.add('post-text');
      postText.innerHTML=post.text;
      let postTags=document.createElement('div');
      postTags.classList.add('tags');
      post.tags.forEach((tag)=>{
          let postTag=document.createElement('a');
          postTag.href=`/blog#${tag}`;
          postTag.innerText=`#${tag}`;
          postTags.append(postTag);
      });
      postDiv.append(postTitle);
      postDiv.append(postDate);
      postDiv.append(postText);
      postDiv.append(postTags);
      return postDiv;
}






function InitHook(){

  let video=document.getElementById("video1");
  let player=document.getElementById("YourPlayerID");
  let blog=document.getElementById("blog");

  if (blog) {
    fetch('http://localhost/api/blog/posts')
  .then(response=>response.json())
  .then((posts)=>{
    Array.from(posts).forEach((post)=>{
        let postDiv=createPost(post);
        blog.append(postDiv);
    });
  });
  }

  

  if (player){

    window.document.dispatchEvent(ReadyEvent);
  }        
  window.scrollTo(0,0);
  $(".delete-img-button").click(function(){
    $(this).parent().parent().css('display','none');
  $.post("/admin/gallery/delete", {filename:$(this).attr('id')});
  });
  $("#files").change(function(){
    if ($(this).val().length>0){
          $(this).siblings('.form-control').prop('disabled', false);
    }
  });
  if (video) {
    video.play();
  }
  if (document.getElementById('YourPlayerID')) {
    var controller = new YTV('YourPlayerID', {
      playlist: 'PLyI9VmhxB4FwTBwiLgyRK0eNTe5tKEQoI',
      responsive: true,
      accent: '#fff',
      browsePlaylists: true,
      seeMore: 'Youtube'
    });
  }
  if (document.querySelector('.tz-gallery')) {
    baguetteBox.run('.tz-gallery');
  }


    $(".delete-button").click(function () {
        var modal = $('#deleteModal');
        modal.attr('name', $(this).attr('name'));
        modal.modal();
    });

    $("#modal-delete").click(function () {
        let modal = $('#deleteModal');
        let idToDelete = modal.attr('name');
        console.log(idToDelete);
        $(`[concertId=${idToDelete}]`).css('display', 'none');
        $.post("/admin/concerts/delete", { id: idToDelete });
        modal.modal('hide');

    });
    $(".fileToUpload").change(function () {
  if ($(this).val().length>0){
        $(this).siblings('.form-control').prop('disabled', false);
  }
    });

    $(".save-button").click(function (ev) {
        var target=ev.target;
        target.setAttribute('disabled','disabled');
        var formName = $(this).attr('name');
        var formData = $('#' + formName).serialize();
        $.post("/admin/concerts/edit", formData, (data, status) => {
                            target.removeAttribute('disabled');
            var oldColor = $(this).css('backgroundColor');
            $(this).animate({ backgroundColor: '#32CD32' }, 1000, function () {
                $(this).animate({ backgroundColor: oldColor });
            });
        }).fail(() => {
            target.removeAttribute('disabled');
            var oldColor = $(this).css('backgroundColor');
            $(this).animate({ backgroundColor: '#8B0000' }, 1000, function () {
                $(this).animate({ backgroundColor: oldColor });
            });
        });
    });


}

barba.hooks.afterLeave(data => {
  // Update the active menu item classes
  console.log("afterLeave");
  if ( data.next.url.path ) {
    $( '.menu-item.' + activeClass ).each( function() {
      $(this).removeClass(activeClass);
    });
    $(`.menu-item > a[href$="${ data.next.url.path }"]`).closest('.menu-item').each( function() {
      $(this).addClass(activeClass);
    });
  }
});






