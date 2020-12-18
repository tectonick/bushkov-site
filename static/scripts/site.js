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
          let player=document.getElementById("YourPlayerID");
          if (player){
            window.document.dispatchEvent(ReadyEvent);
          }
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
        console.log ("enter");

        let video=document.getElementById("video1");
        let player=document.getElementById("YourPlayerID");
        if (player){
          window.document.dispatchEvent(ReadyEvent);
        }

        
        window.scrollTo(0,0);
        
        


        if (video) {
          video.play();
        }
        return gsap.from(data.next.container, {
          opacity: 0,
        });
        
      },
    },
  ],
});


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