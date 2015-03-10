# &lt;math-item&gt;

A custom element that represents a math item/equation/formula.

By including &lt;math-source&gt; elements, different representations can be used for the same math item, such as MathML, (La)TeX and images.

For instance

    <math-item>
      <math-source type="application/x-tex">x+y</math-source>
      <math-source type="application/mathml+xml"><mi>x</mi><mo>+</mo><mi>y</mi></math-source>
    </math-item>

## Renderers

### Pre-built renderers

#### Plain HTML

#### Native MathML

#### MathJax MathML

#### MathJax (La)TeX

### Using custom renderers

## Browser support
