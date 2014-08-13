/*
 * (c) 2014 Mike Chaberski. See LICENSE.
 */

package com.github.mike10004.demo.infinitescroll;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet(name = "item-servlet", urlPatterns = {"/items"})
public class ItemServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        long delay = getParameter(request, "delay", 0, 0, 10 * 1000);
        try {
            Thread.sleep(delay);
        } catch (InterruptedException ex) {
            throw new ServletException(ex);
        }
        int error = getParameter(request, "error", 0, 0, 600);
        if (error != 0) {
            response.sendError(error);
            return;
        }
        response.setContentType("application/json;charset=UTF-8");
        int pageStart;
        int pageSize;
        try {
            pageStart = getParameter(request, "pageStart", 0, 0, Integer.MAX_VALUE);
            pageSize = getParameter(request, "pageSize", 20, 1, Integer.MAX_VALUE);
        } catch (NumberFormatException e) {
            log("failed to parse numbers from " + request.getParameter("pageSize") 
                    + " and " + request.getParameter("pageStart") + "; " + e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }
        int start = Math.max(0, pageStart);
        start = Math.min(start, items.size());
        int end = start + pageSize;
        end = Math.min(end, items.size());
        List<Item> page = Lists.newArrayList(items.subList(start, end));
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        try (PrintWriter out = response.getWriter()) {
            gson.toJson(page, out);
        } 
    }

    int getParameter(HttpServletRequest request, String paramName, int defaultValue, int minInclusive, int maxExclusive) throws NumberFormatException {
        String valueStr = request.getParameter(paramName);
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
    }
    
    private List<Item> items;
    
    @Override
    public void init() throws ServletException {
        Gson gson = new Gson();
        try (InputStreamReader reader = new InputStreamReader(getClass().getResourceAsStream("/items.json"))) {
            List<Item> raw = gson.fromJson(reader, new TypeToken<List<Item>>(){}.getType());
            items = ImmutableList.copyOf(raw);
        } catch (IOException e) {
            throw new ServletException(e);
        }
    }

}
