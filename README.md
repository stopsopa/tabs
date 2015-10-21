# jquery.tabs

Simple and very easy to user tab widget for jQuery


![ScreenShot](http://stopsopa.github.io/demos/jquery.tabs/example.jpg)

## Demo

  [Demo](http://stopsopa.github.io/demos/jquery.tabs/demo.html)

***

## Example


### include scripts


    
```html
        <link rel="stylesheet" href="jquery.tabs.v0.1.css">
        <script src="jquery.tabs.v0.1.js"></script>  
```  
    
    

### html



```html
    <div data-tabs>
        <div data-buttons>
            <span>tab 1</span>
            <span>tab 2</span>
            <a href="javascript:;">tab 3</a>
            <a href="javascript:;">tab 4</a>
            ...
        </div>
        <div data-divs>
            <div>
                content for tab 1
            </div>
            <div>
                content for tab 2
            </div>
            ...
        </div>
    </div>  
```  
    

### javascript


```javascript
    $('[data-tabs]').tabs();
```


## Api



### License

The MIT License (MIT)
Copyright (c) 2015 Szymon Działowski
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


