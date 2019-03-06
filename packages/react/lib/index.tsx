import React, { useState, useEffect, useContext } from 'react';
import { Dynamico } from '@dynamico/core';

export const DynamicComponent = ({ component, props, children, ignoreCache }: any) => {
    const [Component, setComp] : any[] = useState();
    const dynamico = useContext(DynamicoContext);

    const getComponent = async () => {
        if (!dynamico) {
            throw 'mi no dynamico';
        }

        const Comp = await dynamico.get(component, {ignoreCache});

        setComp({view: Comp});
    }

    useEffect(() => {
        getComponent();
    }, []);    

    return Component && Component.view ? <Component.view {...props}></Component.view> : children;
}

export const DynamicoContext = React.createContext<Dynamico | undefined>(undefined);