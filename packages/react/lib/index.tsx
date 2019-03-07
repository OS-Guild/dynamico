import React, { useState, useEffect, useContext, FunctionComponent, ReactElement } from 'react';
import { Dynamico, KeyValue } from '@dynamico/core';

export interface ComponentProps {
    component: string;
    props?: any;
    children: ReactElement;
    ignoreCache?: boolean;
    globals?: KeyValue;
}

interface Component {
    view?: FunctionComponent;
}

interface setComponent {
    (component: Component): void;
}

export const DynamicComponent : FunctionComponent<ComponentProps> = ({ component, props, ignoreCache, globals }) => {
    const [Component, setComponent] : [Component, setComponent]= useState({});
    const dynamico = useContext(DynamicoContext);

    const getComponent = async () => {
        if (!dynamico) {
            throw 'mi no dynamico';
        }

        setComponent({view: await dynamico.get(component, {ignoreCache, globals})});
    }

    useEffect(() => {
        getComponent();
    }, []);    

    return Component.view ? <Component.view {...props}/> : null;
}

export const DynamicoContext = React.createContext<Dynamico | undefined>(undefined);