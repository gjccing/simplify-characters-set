(function () {
  Promise.all([
    new Promise(function (res, rej) {
      jQuery( document ).ready( res ).error( rej );
    }),
    model.loadData()
  ])
  .then(function ([$,model]) {
    var controlPanel = new Vue({
      el: '#app',
      data: {
        options: decorate(model.getOptions()),
        targets: []
      },
      computed: {
        result: function() {
          if ( this.targets ) {
            return `[${
              Array.prototype.concat
                .apply([], this.targets.map(model.getCodeList))
                .sort((a,b)=>a-b)
                .reduce((res, charCode)=>{
                  var scope = res[res.length-1];
                  if (scope && charCode == scope[scope.length - 1] + 1) {
                    scope[1] = charCode;
                  } else {
                    res.push([charCode]);
                  }

                  return res;
                },[])
                .map(scope=>{
                  return scope
                    .map(code=>{
                      var hexCode = code.toString(16);
                      if ( hexCode.length == 1 ) {
                        return '\\x0'+hexCode;
                      } else if ( code < 32) {
                        return '\\x'+hexCode;
                      } else
                        return String.fromCharCode(code);
                    })
                    .join((scope[1]-scope[0]>1)?'-':''); // 入遇到 ^ - \ 需要跳脫
                })
                .join('')
            }]`;
          } else {
            return '';
          }
        }
      },
      methods: {
        addVal: function (option) {
          if (this.targets) {
            var index = this.targets.indexOf(option.id);
            if (index > -1) {
              this.targets.splice(index, 1);
              option.select = false;
            } else {
              this.targets.push(option.id);
              option.select = true;
            }
          } else {
            this.targets = [option.id];
            option.select = true;
          }
        }
      }
    });

    function decorate(options){
      options.forEach(optiongrp=>{
        optiongrp.children.forEach(option=>{
          option.select = null;
        });
      });
      return options;
    }
  })
  .catch(function (e) {
    console.error(e.stack);
  });
})();
