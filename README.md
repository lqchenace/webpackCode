# webpackCode
### 1.核心打包原理：
1） 打包的主要流程如下：
> 1. 需要读到入口文件里面的内容。
> 2. 分析入口文件，递归的去读取模块所依赖的文件内容，生成AST语法树。
> 3. 根据AST语法树，生成浏览器能够运行的代码

### 2. 常见的模块解析包
1. @babel/parser：**将获取到的模块内容 解析成AST（es6的）语法树**
2. @babel/traverse: **遍历AST语法树**
3.  @babel/core @babel/preset-env：**ES6的AST转化成ES5的AST**
