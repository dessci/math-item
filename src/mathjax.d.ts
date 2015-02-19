interface Jax {
    originalText: string;
    SourceElement(): HTMLScriptElement;
    root: {
        toMathML(foo: string): string
    };
}

declare var MathJax: {
    Hub: {
        getJaxFor(id: string): Jax;
        Register: {
            MessageHook(message: string, fn: (arg?: any) => void);
        };
        Queue(...args: any[]): void;
    };
    Callback: {
        After(then: any[], fn: any): void;
    };
};
