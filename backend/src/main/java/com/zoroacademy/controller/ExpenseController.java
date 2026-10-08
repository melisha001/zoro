package com.zoroacademy.controller;

import com.zoroacademy.common.ApiResponse;
import com.zoroacademy.entity.Expense;
import com.zoroacademy.service.ExpenseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;
    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }


    @GetMapping
    public ApiResponse<List<Expense>> getExpenses() {
        return ApiResponse.ok(expenseService.getAllExpenses());
    }

    @PostMapping
    public ApiResponse<Expense> createExpense(@RequestBody Expense expense) {
        return ApiResponse.ok(expenseService.createExpense(expense), "Expense created");
    }

    @PutMapping("/{id}")
    public ApiResponse<Expense> updateExpense(@PathVariable String id, @RequestBody Expense expense) {
        return ApiResponse.ok(expenseService.updateExpense(id, expense), "Expense updated");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteExpense(@PathVariable String id) {
        expenseService.deleteExpense(id);
        return ApiResponse.ok(true, "Expense deleted");
    }
}
