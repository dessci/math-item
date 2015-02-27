interface Jax {
    originalText: string;
    SourceElement(): HTMLScriptElement;
    root: {
        toMathML(foo: string): string
    };
}

interface IMathJax {
    Hub: {
        getJaxFor(id: string|HTMLElement): Jax;
        Register: {
            MessageHook(message: string, fn: (arg?: any) => void);
            StartupHook(message: string, fn: (arg?: any) => void);
        };
        Queue(...args: any[]): void;
    };
    Callback: {
        After(then: any[], fn: any): void;
    };
}

declare var MathJax: IMathJax;
