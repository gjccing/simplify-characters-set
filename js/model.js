var model = (function () {
  'use strict';
  var unicodeData;
  var grpOption;
  var idMap;
  var modelObject = {
    getCodeList(key) {
      if (!idMap)
        getOptions();

      var result = idMap.get(key);
      return (result)?Array.from(result):undefined;
    },
    getOptions() {
      idMap = new Map();
      grpOption = new Map();
      grpOption.set('GENERAL CATEGORY',new Set());
      grpOption.set('CANONICAL COMBINING CLASSES',new Set());
      grpOption.set('BIDIRECTIONAL CATEGORY',new Set());
      grpOption.set('BLOCK',new Set());
      grpOption.set('SCRIPT',new Set());
      grpOption = Array.from(
          unicodeData.reduce((grpOption, properties,index)=>{
            if (properties) {
              properties.forEach((val,property)=>{
                if (val) {
                  grpOption.get(property).add(val);
                  var id = property+':'+val;
                  var indexSet = idMap.get(id);
                  if (!indexSet) {
                    idMap.set(id, indexSet = new Set());
                  }

                  indexSet.add(index);
                }
              });
            }

            return grpOption;
          }, grpOption)
        )
        .map(([group,childSet])=>({
          text: group,
          children:Array
            .from(childSet)
            .sort()
            .map(child=>({
              id:group+':'+child,
              text:child
            }))
        }));
      return grpOption;
    },
    loadData() {
      return Promise.all([
          fetch('./UCD/UnicodeData.txt'),
          fetch('./UCD/Blocks.txt'),
          fetch('./UCD/Scripts.txt')
        ])
        .then(function (responses) {
          return Promise.all(responses.map(resp=>resp.text()));
        })
        .then(function (sourece) {
          unicodeData = sourece[0]
            .split(/\r?\n/)
            .slice(0,-1)
            .map(line=>{
              var data = line.split(';');
              return [data[0],data[2],data[3],data[4]];
            })
            .reduce((res,data)=>{
              var tmp = new Map();
              tmp.set('GENERAL CATEGORY', data[1].trim());
              tmp.set('CANONICAL COMBINING CLASSES', data[2].trim());
              tmp.set('BIDIRECTIONAL CATEGORY', data[3].trim());
              res[Number.parseInt(data[0],16)] = tmp;
              return res;
            }, []);
          sourece[1]
            .split(/\r?\n/)
            .slice(34,296)
            .forEach(line=>{
              var data = line.split(/\.\.|; /g);
              var startCode = Number.parseInt(data[0],16);
              var endCode = Number.parseInt(data[1],16);
              for ( ; startCode <= endCode ; startCode++ )
                if ( unicodeData[startCode] )
                  unicodeData[startCode].set('BLOCK', data[2].trim());
            });
          sourece[2]
            .split(/\r?\n/)
            .map(rec=>rec.replace(/\s*#.*$/,''))
            .filter(rec=>rec)
            .forEach(line=>{
              var data = line.split(/\.\.|\s*;\s*/g);
              var name = data.pop();
              var startCode = Number.parseInt(data[0],16);
              var endCode = Number.parseInt(data[1]||data[0],16);
              for ( ; startCode <= endCode ; startCode++ )
                if ( unicodeData[startCode] )
                  unicodeData[startCode].set('SCRIPT', name.trim());
            });
          return modelObject;
        });
    }
  };
  return modelObject;
})();
