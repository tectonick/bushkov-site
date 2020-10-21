document.getElementById("en").onclick = () => {
  document.cookie = "locale=en; expires=Thu, 18 Dec 2999 12:00:00 UTC; path=/";
};
document.getElementById("ru").onclick = () => {
  document.cookie = "locale=ru; expires=Thu, 18 Dec 2999 12:00:00 UTC; path=/";
};

barba.init({
  transitions: [
    {
      name: "opacity-transition",
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
        return gsap.from(data.next.container, {
          opacity: 0,
        });
      },
    },
  ],
});
