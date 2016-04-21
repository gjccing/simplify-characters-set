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
            return `/[${
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
                        return '\\u000'+hexCode;
                      } else if ( hexCode.length == 2 ) {
                        return '\\u00'+hexCode;
                      } else if ( hexCode.length == 3 ) {
                        return '\\u0'+hexCode;
                      } else if ( hexCode.length == 4 ) {
                        return '\\u'+hexCode;
                      } else {
                        return String.fromCharCode(code);
                      }
                    })
                    .join((scope[1]-scope[0]>1)?'-':'');
                })
                .join('')
            }]/`;
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
              this.targets = this.targets.slice(index, 1);
            } else {
              this.targets = this.targets.concat(option.id);
            }
          } else {
            this.targets = [option.id];
          }
        }
      },
      watch: {
        targets: function (newVal, oldVal) {
          newVal = newVal || [];
          oldVal = oldVal || [];
          var addVal = newVal.filter(val=>!oldVal.includes(val))
            .map(val=>val.replace(/.+:/, ''));
          var delVal = oldVal.filter(val=>!newVal.includes(val))
            .map(val=>val.replace(/.+:/, ''));
          this.$data.options.forEach(optiongrp=>{
            optiongrp.children.forEach(option=>{
              if (addVal.includes(option.text)) {
                option.select = true;
              } else if (delVal.includes(option.text)) {
                option.select = false;
              }
            });
          });
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
