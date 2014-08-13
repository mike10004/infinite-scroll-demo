/*
 * (c) 2014 Mike Chaberski. See LICENSE.
 */

package com.github.mike10004.demo.infinitescroll;

import com.google.common.base.Function;
import com.google.common.base.Functions;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Iterables;
import com.google.common.collect.Lists;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet(name = "item-servlet", urlPatterns = {"/items"})
public class ItemServlet extends HttpServlet {

    public ItemServlet() {
    }

    static Function<String, String> newParamMapFunction(HttpServletRequest request) {
        return Functions.compose(new Function<String[], String>(){
            @Override
            public String apply(String[] input) {
                return input != null && input.length > 0 ? input[0] : null;
            }
        }, Functions.forMap(request.getParameterMap(), null));
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        List<Item> page;
        try {
            page = trim(newParamMapFunction(request));
        } catch (ExceptionWithStatus ex) {
            Logger.getLogger(ItemServlet.class.getName()).log(Level.FINER, ex.getStatus() + " thrown", ex);
            response.sendError(ex.getStatus());
            return;
        }
        response.setContentType("application/json;charset=UTF-8");
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        try (PrintWriter out = response.getWriter()) {
            gson.toJson(page, out);
        } 
    }
    
    public static class ExceptionWithStatus extends Exception {
        final int status;

        public ExceptionWithStatus(int status) {
            this.status = status;
        }

        public ExceptionWithStatus(int status, String message) {
            super("status " + status + "; " + message);
            this.status = status;
        }

        public ExceptionWithStatus(int status, String message, Throwable cause) {
            super("status " + status + "; " + message, cause);
            this.status = status;
        }

        public ExceptionWithStatus(int status, Throwable cause) {
            super("status " + status, cause);
            this.status = status;
        }
        
        public int getStatus() {
            return status;
        }
    }
    
    List<Item> trim(Function<String, String> paramMap) throws ServletException, ExceptionWithStatus {
        int pageStart;
        int pageSize;
        try {
            long delay = getParameter(paramMap, "delay", 0, 0, 10 * 1000);
            try {
                Thread.sleep(delay);
            } catch (InterruptedException ex) {
                throw new ServletException(ex);
            }
            int error = getParameter(paramMap, "error", 0, 0, 600);
            if (error != 0) {
                throw new ExceptionWithStatus(error);
            }
            pageStart = getParameter(paramMap, "pageStart", 0, 0, Integer.MAX_VALUE);
            pageSize = getParameter(paramMap, "pageSize", 20, 1, Integer.MAX_VALUE);
        } catch (NumberFormatException e) {
            throw new ExceptionWithStatus(HttpServletResponse.SC_BAD_REQUEST, e);
        }
        int cap = getParameter(paramMap, "cap", Integer.MAX_VALUE, 0, Integer.MAX_VALUE);
        List<Item> items_ = Lists.newArrayList(Iterables.limit(items, cap));
        int start = Math.max(0, pageStart);
        start = Math.min(start, items_.size());
        int end = start + pageSize;
        end = Math.min(end, items_.size());
        List<Item> page = Lists.newArrayList(items_.subList(start, end));
        return page;
    }

    int getParameter(Function<String, String> paramMap, String paramName, int defaultValue, int minInclusive, int maxExclusive) throws NumberFormatException {
        String valueStr = paramMap.apply(paramName);
        Preconditions.checkArgument(defaultValue >= minInclusive, defaultValue < maxExclusive);
        Preconditions.checkArgument(minInclusive < maxExclusive);
        if (valueStr == null) {
            return defaultValue;
        }
        int value = Integer.parseInt(valueStr);
        if (value < minInclusive) {
            value = minInclusive;
        }
        if (value >= maxExclusive) {
            value = maxExclusive - 1;
        }
        return value;
    }
    
    @Override
    public String getServletInfo() {
        return "item-servlet";
    }

    public static class Item {
        public String color;
        public String id;
        public String timestamp;
        public int index;
    }
    
    private List<Item> items;
    
    @Override
    public void init() throws ServletException {
        loadItems();
    }

    
    protected void loadItems() throws ServletException {
        Gson gson = new Gson();
        try (InputStreamReader reader = new InputStreamReader(getClass().getResourceAsStream("/items.json"))) {
            List<Item> raw = gson.fromJson(reader, new TypeToken<List<Item>>(){}.getType());
            for (int i = 0; i < raw.size(); i++) {
                raw.get(i).index = i;
            }
            items = ImmutableList.copyOf(raw);
        } catch (IOException e) {
            throw new ServletException(e);
        }
    }
}
