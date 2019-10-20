JavaScripture
=============
[JavaScripture.com](http://www.javascripture.com) is designed to be
the fastest and easiest to use JavaScript API reference site by
providing simple descriptions and interactive examples.

Contributing to the Documentation
---------------------------------
JavaScripture's HTML is generated from a series of text files that
contain the API, descriptions, and examples. Each text file describes
one JavaScript type.  The text files are grouped in folders under the
content/ directory. These folders generate the sets available in the
drop down under the search box on the website.

### Copyright and License

Before contributing, be aware that the examples on the site are
in the [public domain](http://creativecommons.org/publicdomain/zero/1.0/).
The remaining documentation and code are available under the 
[Creative Commons Attribution-ShareAlike license](http://creativecommons.org/licenses/by-sa/2.5/).
By contributing, you agree that the works produced are your own and
to release the works under the corresponding license(s) listed above.

### Getting the code and making changes

To contribute, you first need to fork the JavaScripture repository into
your GitHub account where you will make your local changes.  Then
you will issue a pull request to get the get your changes into the main 
repository that the website is built out of.

Here are some helpful links to the GitHub documentation on using GitHub.
* [Fork a Repo](https://help.github.com/articles/fork-a-repo)
* [Pull Requests](https://help.github.com/articles/using-pull-requests)

### Building the documentation

After forking the repository (or making changes to your repository), you can 
build the site's html files.

Prerequisites for building
* [Node](http://nodejs.org/download/)
* Run: npm install

To build the documentation, run:

* node build.js

From the root folder. The generated files are in the docs/ folder.

### Documentation File Format
The information for each type is stored in a .jsdoc file.  This is a
custom file format that describes a JavaScript type.

Here's a simplified example (see content/JavaScript/Array.jsdoc for the complete file):

    Array : Object

    Arrays are containers ...
    
    Spec:
    http://...

    ----
    new Array(length : Number) : Array
    
    Creates a new Array...
    
    <example>
    console.log(new Array(5).length);
    </example>
    
    Spec: 
    http://...
    
    ----
    instance.length : Number
    
    The number of items in ...
    
    <example>
    console.log(new Array(10).length);
    </example>
    
    Spec:
    http://...
    

The file is broken into separate sections for each member of the type. 
The sections are separated by a line containing four dashes: "----"

#### Member Description

The first line in the first section is the type described in the file.
The type is followed by a ":" and the base type.

After first line in the other sections are the member that section describes.  The format for this line can be in any of the following:
* *Type*(*parameterList*) : *ReturnType*
    * Describes the parameters and return value of calling the function without `new`. 
    * Example: 
        * [Date() : String](http://www.javascripture.com/Date#Date)
* new *Type*(*parameterList*) : *Type*
    * Describes the parameters for the type when constructing an instance using the `new` keyword.
    * Example:
        * [new Array(length : Number) : *Array*](http://www.javascripture.com/Array#new_Array_Number)
* instance.*propertyName* : *PropertyType*
    * Describes a property on an instance of the type.
    * Example:
        * [instance.length : Number](http://www.javascripture.com/Array#length)
* prototype.*methodName*(*parameterList*) : *ReturnType*
    * Describes a method on an instance of the type.
    * Example:
        * [prototype.join(\[separator=',' : String\]) : String](http://www.javascripture.com/Array#join)
* *typePropertyName* : *Type*
    * Describes a property on the type.
    * Example:
        * [MAX_VALUE : Number](http://www.javascripture.com/Number#MAX_VALUE)
* *typeMethodName*(*parameterList*) : *ReturnType*
    * Describes a method on the type.
    * Example:
        * [isArray(value : Object) : Boolean](http://www.javascripture.com/Array#isArray)

The *parameterList* is a comma separated list of "name : Type" pairs (or empty if there are parameters).  Optional parameters should be wrapped in []. After the name, you can specify " = value" to specify what value is used if the parameter is not specified.  Here are some examples:
* [isArray(value : Object) : Boolean](http://www.javascripture.com/Array#isArray)
* [RegExp(pattern : String, \[flags : String\]) : RegExp](http://www.javascripture.com/RegExp#RegExp_String_String)
* [new Date(year : Number, month : Number, \[date = 1 : Number, \[hours = 0 : Number, \[minutes = 0 : Number, \[seconds = 0 : Number, \[milliseconds = 0 : Number\]\]\]\]\]) : Date](http://www.javascripture.com/Date#new_Date_Number_Number_Number_Number_Number_Number_Number)

If the method takes a function as a parameter, such as a callback, you can specify parameters and return value such as:
* [prototype.forEach(callback(item : Object, index : Number, array: Array) : undefined, \[thisArg : Object\]) : undefined](http://www.javascripture.com/Array#forEach)


If the method takes an object with several properties, you can define the expected properties like:

    new Blob( \ 
        blobParts : Array, \
        [blobPropertyBag : { \
            type : String /* A valid mime type such as **'text/plain'** */, \ 
            endings = 'transparent' : String /* Must be either **'transparent'** or **'native'** */ \ 
        }]) : Blob

#### Description
After the first line of the section comes the description text for that
member. In the description area, there is some special syntax to add
links, code tags and examples.

* Use %%*link*|*Link Description*%% to generate &lt;a href="link"&gt;Link Description&lt;/a&gt;
* Use \*\* *Code* \*\* to generate &lt;code&gt;Code&lt;/code&gt;

Also inside the description section you can add an example using the format:

    <example>
    console.log(10);
    </example>

Or

    <htmlexample>
    <div>Hi</div>
    <script>
      console.log(10);
    </script>
    </htmlexample>

The &lt;example&gt; generates an interactive example that only contains
a text output area. &lt;htmlexample&gt; generates an interactive
example that has an iframe to display the HTML and a text area below
that to display the console output.

#### Metadata

After the description comes additional metadata for the member.  The metadata is described by:

<pre><code><em>MetadataName</em>:
<em>MetadataValue</em>
</code></pre>

The possible MetadataNames are:
* Spec - the value should be the link to the specification 
* ReadOnly - value should be true if the property is read only.  Defaults to false.
* Value - the value of the property such as [seen here](http://www.javascripture.com/XMLHttpRequest#DONE)

Places For Contribution
-----------------------
Any contributions would be greatly appreciated.

Here are some ideas for improvements:
* Spelling, grammar, and other editorial issues
* Add missing descriptions and examples
* Add any missing types
* Switch documentation format to Markdown
* Translate in other languages than English
