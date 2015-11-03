# jquery.tabs

Simple and very easy to user tab widget for jQuery


![ScreenShot](http://stopsopa.github.io/submod/tabs/demo/example.jpg)

## Demo

  [Demo](http://stopsopa.github.io/submod/tabs/demo/demo.html)

***

## Npm instalation 

<p align="center">
  <a href="https://www.npmjs.com/package/stopsopa.tabs">
    <img width="60" src="https://www.npmjs.com/static/images/npm-logo.svg">
  </a>
</p>

```
    npm install stopsopa/tabs
```

## Example


### include files

```html
        <link rel="stylesheet" href="jquery.tabs.v0.1.css">
        <script src="jquery.tabs.v0.1.js"> </script>  
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

Initialize and select specific tab on start:

```javascript
    $('[data-tabs]').tabs({
        active: 2 // make active thisr tab on start (default: 0) 
    });
```   
 

you can also check tab as a selected on start in html by adding 'active' class in one of two places:


```html
    <div data-tabs>
        <div data-buttons>
            <span>tab 1</span>
            <span class="active">tab 2</span> <!-- here -->
            <a href="javascript:;">tab 3</a>
            <a href="javascript:;">tab 4</a>
            ...
        </div>
        <div data-divs>
            <div>
                content for tab 1
            </div>
            <div class="active">   <!-- or here -->
                content for tab 2
            </div>
            ...
        </div>
    </div>  
```  

(activating by api has higher priority then in html and
adding class 'active' in [data-buttons] has higher priority then adding in section [data-divs])  
 
  
 

Change tab programmatically: 

```javascript
    $('[data-tabs]').tabs('active', 2); // active third tab
```  
 

Destroy component - unbind all methods and clean up all context, (dom nodes stay as is),
after that you can initialize widget on the same dom element again.

```javascript
    $('[data-tabs]').tabs('destroy');
```  
 

There is also available special selector to find all initialized tab components ... :


```javascript
    $(':tabs').tabs('active', 1) // active second tab for all tab components
```  
 

... or to check if dom element is already initialized as a tab component:

```javascript
    var element = $('... some selector ...');
    if (element.is(':tabs')) {
        // do stuff
    }
```  
 

# events

```javascript
    $('[data-tabs]')
        .on('tabs:change', function (e, i, tab, div, isFirst) {
            // better define .on() events before call .tabs(),
            // because .tabs() will have no opportunity to call this event 
            //    during initialization
            
            if (isFirst) { // isFirst -> is this a first click on tab?,
                div.find('.editor, .syntax').aceedit(); 
                  // initialize javascripts on content of tab
            }
            
            // e        - native event object
            // i        - index of current tab
            // tab      - jQuery element representing clicked tab
            // div      - jQuery element representing div with tab content
            // isFirst  - flag to determine if this is first show of 
            //            tab content, usially useful for initialize 
            //            javascript inside tab that can't be done 
            //            if content is display: none;
        })
        .tabs()
```  
 
  
 

### License

The MIT License (MIT)
Copyright (c) 2015 Szymon Działowski
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


