// 获取主入口文件
const fs = require("fs");
const path = require("path");
//分析模块
const parser = require("@babel/parser");
//收集依赖
const traverse = require("@babel/traverse").default;
//转化代码语法的核心库
const babel = require("@babel/core");


/**
 * getModuleInfo  获取模块的内容
 * @param {文件路径} file 
 * @return  该模块的路径（file），该模块的依赖（deps），该模块转化成es5的代码
 */
const getModuleInfo = (file) => {
  const body = fs.readFileSync(file, "utf-8"); //同步获取文件的内容
  const ast = parser.parse(body, {
    sourceType: "module", //表示我们要解析的是ES模块
  });
  // traverse遍历AST语法树，保存Import依赖包的引用路径
  const deps = {};
  traverse(ast, {
    //  ImportDeclaration方法代表的是对type类型为ImportDeclaration的节点的处理。
    ImportDeclaration({ node }) {
      const dirname = path.dirname(file);
      //node.source.value 指的是import的值，如，index.js文件中引入的 './add' 和 './minus'
      const abspath = "./" + path.join(dirname, node.source.value);
      deps[node.source.value] = abspath;
    },
  });
  //transformFromAst传入的AST转化成我们在第三个参数里配置的模块类型
  const { code } = babel.transformFromAst(ast, null, {
    presets: ["@babel/preset-env"],     //es5模块类型
  });
  const moduleInfo = {file,deps,code}
  return moduleInfo
};
//递归循环遍历依赖
const parseModules = (file) =>{
    const entry =  getModuleInfo(file)
    const temp = [entry];
    const depsGraph = {};
    for (let i = 0;i<temp.length;i++){
        const deps = temp[i].deps
        if (deps){
            for (const key in deps){
                if (deps.hasOwnProperty(key)){
                    temp.push(getModuleInfo(deps[key]))
                }
            }
        }
    }
    temp.forEach(moduleInfo=>{
        depsGraph[moduleInfo.file] = {
            deps:moduleInfo.deps,
            code:moduleInfo.code
        }
    })
    return depsGraph;
}
const bundle = (file) =>{
    const depsGraph = JSON.stringify(parseModules(file));
    //因为浏览器不会识别执行require和exports,所以自己植入代码增加require和exports，让所有依赖代码都运行起来
    //absRequire 获取的是依赖的绝对路径
    return `(function (graph) {
        function require(file) {
            function absRequire(relPath) {
                return require(graph[file].deps[relPath])
            }
            var exports = {};
            (function (require,exports,code) {
                eval(code);
            })(absRequire,exports,graph[file].code)
            return exports;
        }
        require('${file}')
    })(${depsGraph})`

}
const content = bundle('./src/index.js')

//写入到我们的dist目录下
fs.mkdirSync('./dist');
fs.writeFileSync('./dist/bundle.js',content)
